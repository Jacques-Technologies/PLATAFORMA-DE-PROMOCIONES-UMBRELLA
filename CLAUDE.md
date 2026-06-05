# Que Pollo — Plataforma de promociones WhatsApp

Plataforma de registro de tickets para campañas promocionales (Jerseys, Huevo Campeón).
La conversación corre en **Kapso (WhatsApp)**, el OCR y la persistencia en **Firebase**.

## Componentes

- [`functions/`](functions/) — Cloud Functions Python 3.12 que expone endpoints HTTP para Kapso (`ocr_ticket`, `consultar_folio`, `crear_registro`) + el callable `export_registros_xls` que alimenta el dashboard. Ver [`functions/CLAUDE.md`](functions/CLAUDE.md).
- [`web/`](web/) — Dashboard admin (Vite/Vue). No tocado en sesiones recientes.
- [`kapso/`](kapso/) — Workspace local del workflow Kapso (`que-pollo-promociones`) y sus 7 functions JS. Ver [`kapso/CLAUDE.md`](kapso/CLAUDE.md).
- [`scripts/`](scripts/) — Scripts auxiliares (seed de emulator).

## Stack

- **Firebase project**: `que-pollo-jtech`, region funcional `us-central1`, Firestore region `nam5`.
- **Default storage bucket**: `que-pollo-jtech.firebasestorage.app`.
- **Kapso project ID**: `f7039bf5-3778-4773-b9c8-e95e296f11e4` (proyecto "Que Pollo"). API key en `~/.claude/settings.json` como `KAPSO_API_KEY`.
- **WhatsApp phone_number_id productivo**: `1113227451868988` (+52 1 81 1129 7351).

## Comandos clave (root)

```bash
npm run dev:emulators    # firebase emulators
npm run deploy:functions # firebase deploy --only functions
npm run deploy:rules     # firestore.rules + storage.rules
npm run deploy           # web build + firebase deploy (todo)
```

## Secretos compartidos

- `KAPSO_TO_FIREBASE_KEY` — bearer compartido (header `X-API-Key`) entre Kapso functions y Firebase HTTP endpoints. Vive como Firebase Secret y como hardcoded en cada Kapso function (ver `kapso/CLAUDE.md`).
- `GEMINI_API_KEY` — para `ocr_ticket` (Gemini 2.5 Flash Lite).
- Ambos definidos como Firebase Secrets vía `firebase functions:secrets:set`.

## Modelo de datos (Firestore)

Colección **`registros`** (compartida con dashboard preexistente). El doc se crea **incrementalmente** durante el flujo de WhatsApp:

| Etapa | Campos persistidos | Estado |
|---|---|---|
| Cliente da nombre | `campania`, `Whatsapp_registro`, `Nombre_registro`, `ID_registro`, `Fecha_registro` | `Clasificacion_registro: "INVALIDO"`, `Trivia_registro: "no"` |
| OCR exitoso | `Folio_ticket`, `Sucursal_ticket`, `Fecha_ticket`, `Monto_ticket`, `Kg_bistec`, `Archivo_url_origen` (URL Kapso) | sigue INVALIDO |
| Trigger Firestore async | `Archivo_path`, `Archivo_url` (signed v4) — escritos por `procesar_archivo_registro` cuando detecta `Archivo_url_origen` sin `Archivo_path` | sigue INVALIDO |
| Trivia correcta | `Clasificacion_registro: "VALIDO"`, `Trivia_registro: "yes"` | VALIDO final |

```
registros/{auto-id}
  campania: "jerseys" | "huevo_campeon"
  ID_registro: "J-0000001" | "H-0000001"  # consecutivo por campaña, {prefix}-{7d}
  Whatsapp_registro, Nombre_registro
  Fecha_registro (timestamp UTC, momento de inicio del flujo)
  Folio_ticket                    # presente desde el OCR
  Sucursal_ticket, Fecha_ticket, Monto_ticket, Kg_bistec  # solo jerseys, desde el OCR
  Clasificacion_registro: "VALIDO" | "INVALIDO"
  Trivia_registro: "yes" | "no"
  Archivo_path: "tickets/{ID_registro}.jpeg"  # solo si llegó al OCR
  Archivo_url: <signed URL v4 a 7 días>
  Archivo_url_origen: <URL Kapso original, para debug>
```

Si el cliente abandona en cualquier etapa, el doc queda en INVALIDO con los campos que alcanzó a tener — útil para analytics de embudo.

Colección **`counters`** (atómico para IDs consecutivos, transaccional):
```
counters/jerseys: { last: <int> }
counters/huevo_campeon: { last: <int> }
```

Cada **inicio de flujo** (cliente da nombre) consume un ID, aunque nunca se complete.

Colecciones existentes que NO toca este flujo: `usuarios_admin`, `sucursales_participantes`, `configuracion`.

## Reglas críticas de timezone

Todas las fechas que vienen del OCR (Gemini) son **hora local de México** sin TZ. Firestore guarda como UTC. El dashboard / export deben convertir a `America/Mexico_City` al display. Ver `crear_registro.py` y `export_registros_xls.py`.

## Documentación viva

- Plan original: `~/.claude/plans/haz-todo-tu-las-floofy-rocket.md`
- Lógica de campañas: `umbrella - lógica de campañas.xlsx` (raíz del repo, hoja JERSEY)
