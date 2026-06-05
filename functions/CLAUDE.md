# Cloud Functions Python — que-pollo-jtech

Python 3.12 + `firebase-functions ~=0.4.2` + `firebase-admin ~=6.5.0`. Despliegue en `us-central1`.

## Estructura

```
functions/
├── main.py                   # punto de entrada: importa+exporta cada function
├── requirements.txt
├── venv/                     # virtualenv local (deps ya instaladas)
├── que_pollo/
│   ├── __init__.py
│   ├── firebase_app.py       # initialize_app() singleton
│   ├── storage_utils.py      # download_image, upload_ticket, signed_url_v4
│   ├── http/
│   │   ├── auth.py           # KAPSO_API_KEY SecretParam + require_api_key()
│   │   ├── ocr_ticket.py     # POST: Gemini multimodal → JSON ticket
│   │   ├── consultar_folio.py # GET: query Firestore por folio + campania
│   │   ├── crear_registro.py # POST: crea doc, sube imagen a GCS, ID consecutivo
│   │   ├── migrar_archivos.py # POST: re-sube imágenes externas a GCS (idempotente)
│   │   └── whatsapp_webhook.py # stub
│   └── callables/
│       └── export_registros_xls.py  # Firebase Auth callable, alimenta dashboard
```

## Patrón obligatorio para nuevos archivos

```python
from firebase_functions import https_fn
from .. import firebase_app as _app  # noqa: F401  (initialize_app)
from .auth import KAPSO_API_KEY, require_api_key  # solo si endpoint público

@https_fn.on_request(
    region="us-central1",
    secrets=[KAPSO_API_KEY],          # NO olvidar declarar el secret
    memory=512, timeout_sec=30,
)
def my_endpoint(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error
    ...
```

Después agregar `from que_pollo.http.my_endpoint import my_endpoint` y appendearlo a `__all__` en [`main.py`](main.py).

## Secrets

- `KAPSO_TO_FIREBASE_KEY` — header `X-API-Key` para todo endpoint llamado desde Kapso.
- `GEMINI_API_KEY` — solo `ocr_ticket`.
- Setear: `firebase functions:secrets:set NAME`. Acceder vía `SecretParam("NAME").value` dentro del handler (no a nivel módulo). Declarar en el decorator: `secrets=[NAME_PARAM]`.

## Endpoints HTTP públicos (URLs)

Base: `https://us-central1-que-pollo-jtech.cloudfunctions.net/`

| Endpoint | Método | Auth | Notas |
|---|---|---|---|
| `ocr_ticket` | POST | X-API-Key | `{image_url, campania}` → Gemini, devuelve `{ok, data}` o `{ok:false, reason}` |
| `consultar_folio` | GET | X-API-Key | `?folio=&campania=&include_doc=1` (include_doc opcional, devuelve doc completo + doc_id) |
| `crear_registro` | POST | X-API-Key | Body **mínimo** `{campania, whatsapp, nombre}`. Crea doc INVALIDO con `Trivia_registro:"no"`, asigna ID consecutivo. NO sube imagen. |
| `actualizar_registro` | POST | X-API-Key | PATCH incremental. Body `{id_registro, campania, ...campos opcionales}`. Si llega `archivo_url`, solo registra `Archivo_url_origen`; el upload a GCS lo hace `procesar_archivo_registro` async. |
| `migrar_archivos` | POST | X-API-Key | Recovery manual: re-procesa docs con `Archivo_url_origen` pero sin `Archivo_path`. Idempotente. |
| `whatsapp_webhook` | GET/POST | sin auth (stub) | placeholder |

### Trigger Firestore

- **`procesar_archivo_registro`** (`que_pollo/triggers/`) — `firestore_fn.on_document_written` sobre `registros/{doc_id}`. Cuando un doc tiene `Archivo_url_origen` y NO tiene `Archivo_path`, descarga la imagen, la sube a `tickets/{ID_registro}.{ext}` en GCS, y actualiza el doc con `Archivo_path` + `Archivo_url` (signed URL v4 a 7 días). Idempotente: el guard `Archivo_path` rompe el loop al re-trigger. Memory 512Mi, timeout 120s, max_instances 5.

**Flujo de persistencia** (orden de llamadas desde Kapso):
1. `crear_registro` — apenas el cliente da su nombre. Devuelve `id_registro` (`J-0000XXX` / `H-0000XXX`).
2. `actualizar_registro` con datos del OCR + `archivo_url` (dispara upload GCS).
3. `actualizar_registro` con `clasificacion: "VALIDO"`, `trivia: "yes"` al completar la trivia exitosamente.

Cualquier abandono entre 1 y 3 deja el doc como INVALIDO con los campos que alcanzó a recibir.

## Convenciones del schema `registros`

- **Trivia_registro**: string `"yes"` o `"no"` (NO boolean), por compat con el dashboard que hace `value == "yes"`. Default al crear: `"no"`.
- **Clasificacion_registro**: string `"VALIDO"` o `"INVALIDO"` (sin acento). Dashboard mapea a "VÁLIDO"/"INVÁLIDO" al display. Default al crear: `"INVALIDO"`.
- **ID_registro**: formato `{J|H}-{7 dígitos}`. Generado vía transacción Firestore sobre `counters/{campania}.last` — atómico ante concurrencia. **El counter se consume al crear el doc inicial** (no al final), así que abandonos también consumen IDs.
- **Fechas**: timestamps `datetime` con tzinfo. `Fecha_ticket` viene del OCR como ISO sin TZ → asumir hora MX (`ZoneInfo("America/Mexico_City")`) en el `_parse_iso` de `actualizar_registro`. `Fecha_registro` se setea con `SERVER_TIMESTAMP` al crear (etapa 1, cuando el cliente da su nombre — NO cuando completa).

## Storage (GCS)

- Bucket: default (`que-pollo-jtech.firebasestorage.app`).
- Path tickets: `tickets/{ID_registro}.{ext}` (jpeg/png/webp).
- Storage rules en [/storage.rules](../storage.rules): `tickets/{file}` solo admin. La signed URL v4 (a 7 días) bypasses rules — usable desde `<img src=...>`.
- Para regenerar signed URL después de la expiración: usar `Archivo_path` con Admin SDK.

## Deploy

```bash
# desde root del repo:
npm run deploy:functions

# función específica:
firebase deploy --only functions:ocr_ticket --project que-pollo-jtech

# index Firestore:
firebase deploy --only firestore:indexes
```

**Importante**: el venv local (`functions/venv/`) debe tener todas las deps de `requirements.txt` instaladas porque firebase CLI lo usa para analizar el código antes del deploy. Si agregas import nuevo, primero `pip install <pkg>` en el venv, después deploy.

## Logs

```bash
firebase functions:log --only ocr_ticket --project que-pollo-jtech
```

Cloud Functions Gen2 NO loggea invocaciones exitosas a severity DEFAULT — solo errores. Para verificar invocaciones success, mirar Firestore (si es write) o el response del caller.

## Gotchas

- `_format_cell` del export hace `value.astimezone(MX_TZ).strftime(...)` — necesita que el datetime tenga tzinfo. Firestore lo devuelve con UTC, y el `astimezone` lo convierte. Si en el futuro guardas un naive datetime, romperá.
- El callable `export_registros_xls` requiere admin Firebase Auth + doc en `usuarios_admin`. No usable desde Kapso — por eso los endpoints HTTP usan API key separada.
- `requests.get` en `download_image` sigue redirects automáticamente (`allow_redirects=True`). Necesario para URLs de Kapso (Rails active_storage redirect).
