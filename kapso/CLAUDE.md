# Kapso workspace — Que Pollo

Workspace local del proyecto Kapso `f7039bf5-3778-4773-b9c8-e95e296f11e4` ("Que Pollo").
Contiene 1 workflow productivo + 7 functions JS que orquestan las campañas de WhatsApp.

## Estructura

```
kapso/
├── kapso.yaml                # marker (version: 1)
├── .kapso/
│   ├── project.json          # auth=api_key, link via $KAPSO_API_KEY
│   └── remote-map.json       # último estado pulled (hashes para detectar dirty)
├── functions/
│   ├── firebase-ocr-ticket/         # decide: ok/failed; llama Firebase OCR
│   ├── firebase-consultar-folio/    # decide: exists/not_exists
│   ├── firebase-crear-registro/     # function: crea doc INVALIDO con nombre+whatsapp+campania, devuelve id_registro
│   ├── firebase-actualizar-registro/ # function: PATCH con datos del OCR + archivo (sube a GCS)
│   ├── firebase-finalizar-registro/ # function: marca VALIDO + trivia=yes al final
│   ├── decide-inicial-ab/           # decide: a/b/invalid (router del menú)
│   ├── decide-kg-suficiente/        # decide: yes/no
│   ├── decide-trivia-correct/       # decide: correct/wrong
│   ├── decide-rango-cupon/          # decide: en_rango/fuera_rango (folio Huevo Campeón ∈ 1..50)
│   └── incrementar-intentos-ocr/    # decide: agotados/reintentar (counter)
└── workflows/
    └── que-pollo-promociones/       # workflow productivo (status: active)
        ├── workflow.yaml             # remote-owned (slug, name, status, triggers)
        ├── workflow.js               # ★ source-of-truth, hand-authored
        └── definition.json           # generated por kapso build
```

## Flujo de persistencia (3 puntos en cada sub-flujo)

Cada sub-flujo (Jerseys, Huevo Campeón) tiene 3 nodos `function` que persisten/actualizan el registro en Firebase:

1. **`fn_*_init`** (slug `firebase-crear-registro`): después de `wait_*_nombre`. Crea doc INVALIDO con nombre+whatsapp+campania, asigna ID consecutivo (`J-XXXXXXX` / `H-XXXXXXX`). Setea `vars.id_registro`.
2. **`fn_*_save_ocr`** (slug `firebase-actualizar-registro`): en la rama `ok` de `decide_*_ocr`. PATCH con folio + datos del ticket + dispara upload de imagen a GCS (signed URL queda en el doc).
3. **`fn_*_crear`** (slug `firebase-finalizar-registro`): en la rama `correct` de `decide_*_trivia`. PATCH final con `clasificacion=VALIDO`, `trivia=yes`. (El nombre del nodo se mantiene por estabilidad de layout pese a que ya no "crea" sino que "finaliza".)

## Reglas de oro (DOLEN si las ignoras)

### 1. SIEMPRE `kapso pull --overwrite` antes de cualquier `push`

El user reorganiza nodos visualmente en el canvas. Esos cambios viven en el remote `definition.json`. Si haces `push` sin `pull`, los machacas. La regla:

```bash
cd kapso/
kapso pull --overwrite     # OK: preserva workflow.js (hand-authored)
# editar workflow.js o functions/<slug>/index.js
kapso push function <slug>      # o
kapso push workflow <slug>
```

### 2. `pull --overwrite` PRESERVA `workflow.js` pero NO `function/index.js`

Confirmed via `Warning: Preserved authored workflow source: workflows/<slug>/workflow.js`. Las functions JS sí se sobreescriben. Si tenías cambios sin pushear en una function, los pierdes. Workflow → siempre seguro. Functions → push antes de pull si tenías cambios pendientes.

### 3. `kapso push` se debe ejecutar desde el workspace (`kapso/`)

Si lo corres desde otra cwd, tira `Local function "X" not found` o crea un workspace anidado. El cwd de Bash a veces se resetea entre llamadas — `cd kapso/ && kapso push ...` en el mismo command.

### 4. Slugs en kebab-case obligatorio

Platform API rechaza `firebase_ocr_ticket` con HTTP 422 (`slug must be lowercase alphanumeric with hyphens`). Las carpetas, `function.yaml.slug`, `function.yaml.name`, y las referencias en `workflow.js` (`functionSlug:`) deben ser `firebase-ocr-ticket`.

### 5. function.yaml requiere campo `slug`

Mínimo:
```yaml
slug: firebase-ocr-ticket
name: firebase-ocr-ticket
description: ...
```
Sin `slug`, `kapso build` falla con `slug "undefined"`.

### 6. Nodos `decide` requieren typed nodes, NO `type: "raw"`

```js
// ❌ MAL: el validador no lo reconoce como decide → warnings "Non-decision node"
workflow.addNode(id, {
  config: { decision_type: "function", function_slug: "...", conditions },
  nodeType: "decide",
  type: "raw",
});

// ✅ BIEN:
workflow.addNode(id, {
  type: "decide",
  decisionType: "function",
  functionSlug: "decide-trivia-correct",
  conditions: [{ label: "correct", description: "..." }, { label: "wrong" }],
});
```

Ver `@kapso/workflows/dist/types.d.ts` para todos los typed shapes (SendTextNode, FunctionNode, ButtonInteractiveNode, etc.).

## Secrets en functions JS — NO usar `env.X`

`env.X` en el handler refiere a **function-level secrets**, NO a project-level env vars. Las project env vars `${ENV:NAME}` solo se interpolan en config de nodos del workflow (URL/headers de webhook node), no en código JS.

**Estado actual**: `FIREBASE_KEY` y `FIREBASE_BASE_URL` están **hardcoded** en las 3 firebase-* functions con TODO. Si Kapso expone una UI/endpoint claro para function-level secrets, migrar.

```js
// estado actual en firebase-ocr-ticket/index.js:
const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8"; // KAPSO_TO_FIREBASE_KEY
```

## Inputs de WhatsApp — gotchas

- **Imagen**: cuando el usuario manda media, `vars.archivo_ticket` llega como string compuesto `"Image attached (...) URL: https://..."`, NO como URL plana. Extraer con regex `https?://\S+`. Ver `firebase-ocr-ticket/index.js > pickUrl()`.
- **Botón interactivo**: la respuesta llega como `"Selected: a) Jerseys"` (con prefijo "Selected: "). Para identificar la opción usar `pickOptionLetter()` en `decide-trivia-correct/index.js` o regex tolerante en `decide-inicial-ab/index.js`.
- **URLs de Kapso**: son redirects de Rails active_storage, `requests.get` (Python) las sigue automáticamente.

## Workflow productivo — `que-pollo-promociones`

- **ID**: `e0190a79-0a07-4657-8910-7102d681e37a`
- **Trigger**: `inbound_message` en `phoneNumberId="1113227451868988"` (Que Pollo +52 1 81 1129 7351). Setear vía env var `KAPSO_PHONE_NUMBER_ID` antes de build.
- **45 nodos**: router A/B → 2 sub-flujos (jerseys, huevo_campeon), cada uno con 3 puntos de persistencia (init/save_ocr/finalizar).
- **Estado**: por conversación se mantienen `nombre_registro`, `archivo_ticket`, `intentos_ocr`, `campania_actual`, `folio`, `sucursal`, `fecha_ticket`, `fecha_ticket_legible`, `monto_ticket`, `kg_bistec`, `trivia_resp`, `id_registro` (asignado por `fn_*_init`).
- **Reinicio**: cuando un mensaje nuevo llega tras END, Kapso arranca nueva ejecución desde `start` (sin estado previo).

## Comandos

```bash
cd kapso/

kapso status                         # auth + project info
kapso pull --overwrite               # 1ro siempre
kapso build                          # compila workflow.js → definition.json
kapso push --dry-run                 # preview
kapso push                           # todo (cuidado, toca también untitled-workflow*)
kapso push function <slug>           # solo una function
kapso push workflow que-pollo-promociones

# trigger en producción:
KAPSO_PHONE_NUMBER_ID=1113227451868988 kapso build
KAPSO_PHONE_NUMBER_ID=1113227451868988 kapso push workflow que-pollo-promociones
```

## Debug de invocaciones

```bash
# listar functions:
curl -sS "https://api.kapso.ai/platform/v1/functions" -H "X-API-Key: $KAPSO_API_KEY"

# últimas invocaciones de una function (ver request_body, response_body, status, duration):
FN_ID=<id>
curl -sS "https://api.kapso.ai/platform/v1/functions/$FN_ID/invocations?per_page=5" -H "X-API-Key: $KAPSO_API_KEY"

# invocación manual (para probar en aislamiento):
curl -sS -X POST "https://api.kapso.ai/platform/v1/functions/$FN_ID/invoke" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"execution_context":{"vars":{...}},"available_edges":["..."]}'
```

## Workflows `untitled-*` (legacy, no tocar)

`untitled-workflow`, `untitled-workflow-2`, `untitled-workflow-3` son experimentos previos del usuario. `kapso build` los reformatea sin cambiar contenido — al hacer push, sale "3 update". Pushea solo el workflow específico (`kapso push workflow que-pollo-promociones`) para no alterarlos.
