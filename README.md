# Que Pollo · Plataforma de Promociones

Webapp admin de solo lectura para consultar registros de tickets que entran por WhatsApp con una mecánica de trivia. El webhook (que se construye en otra iteración) hará OCR del ticket, asignará `ID_registro` y calculará `Clasificacion_registro`. La plataforma sirve para que el admin filtre, consulte y exporte a XLS.

- **Proyecto Firebase**: `que-pollo-jtech`
- **Hosting URL**: https://que-pollo-jtech.web.app
- **Console**: https://console.firebase.google.com/project/que-pollo-jtech/overview

## Stack

- **Frontend** (`web/`): Vite 8 + React 19 + TypeScript, Tailwind v4 con tokens del .pen, TanStack Query/Table, React Router 7, React Hook Form + Zod, Firebase Web SDK v12.
- **Backend** (`functions/`): Cloud Functions v2 en Python 3.12 (`firebase-functions` SDK + `openpyxl`). Solo dos functions: `export_registros_xls` (callable) y `whatsapp_webhook` (stub).
- **Infra**: Firebase Hosting + Firestore + Auth (Email/Password) + Storage + Functions.

## Estructura

```
que-pollo/
├── firebase.json, .firebaserc, firestore.rules, storage.rules, firestore.indexes.json
├── web/                  # Vite + React
│   └── src/
│       ├── lib/          # firebase.ts, queryClient.ts, utils.ts
│       ├── components/   # Button, Inputs, Dialog, Badge, Header
│       ├── features/auth/        # Login, Forgot, Reset, ProtectedRoute, useAuth
│       └── features/registros/   # Lista, filtros, tabla, detalle, export
├── functions/            # Cloud Functions Python
│   ├── main.py
│   ├── requirements.txt
│   └── que_pollo/{callables,http}/
└── scripts/seed-emulator.mjs
```

## Acceso

- **URL**: https://que-pollo-jtech.web.app
- **Email**: `daniel@jtech.mx`
- **Password actual**: ver `/tmp/admin-pass.txt` (o resetéala con "¿Olvidaste tu contraseña?").

Datos seed cargados:
- 1 admin user (`/usuarios_admin/<uid>`)
- 4 sucursales participantes (`/sucursales_participantes/{001..004}`)
- `/configuracion/global { monto_minimo: 150 }`
- 3 registros de ejemplo (`J-0000001`, `J-0000002`, `J-0000003`)

Para agregar más admins en el futuro:
1. https://console.firebase.google.com/project/que-pollo-jtech/authentication/users → **Add user**.
2. Copiar el **User UID**.
3. Crear el doc en Firestore `usuarios_admin/{uid}` con `{email, nombre, created_at}`.

## Comandos útiles

```bash
# Desarrollo local del frontend (apunta al proyecto real de Firebase)
npm --prefix web run dev

# Build + deploy
npm run build
firebase deploy --only hosting           # solo el frontend
firebase deploy --only firestore:rules   # solo reglas
firebase deploy --only functions         # requiere Blaze
firebase deploy                          # todo

# Emuladores (requiere Java 21+ — actualmente bloqueado en este equipo con Java 17)
firebase emulators:start
node scripts/seed-emulator.mjs           # popular emuladores con admin + sucursales + 3 registros
```

## Modelo de datos

```
/registros/{docId}
  ID_registro                "J-0000123"            // asignado por el webhook
  Fecha_registro             Timestamp
  Nombre_registro            string
  Whatsapp_registro          string
  Trivia_registro            "yes" | "no"
  Fecha_ticket               Timestamp
  Folio_ticket               string
  Sucursal_ticket            string                 // "001 - Sucursal Centro"
  Monto_ticket               number
  Productos_ticket           string[] | null
  Archivo_ticket             string                 // path en Storage
  Clasificacion_registro     "VALIDO" | "INVALIDO"  // calculada por el webhook

/usuarios_admin/{uid}        { email, nombre, created_at }
/sucursales_participantes/{numero}  { numero, nombre, activa }
/configuracion/global        { monto_minimo: number }
```

Las reglas de Firestore (`firestore.rules`) hacen `allow write: if false;` para `registros`, `sucursales_participantes` y `configuracion`. Sólo el webhook (Admin SDK) puede escribir; el admin de la plataforma sólo lee.

## Funciones

- `export_registros_xls` (HTTPS callable): recibe los filtros activos, hace query a Firestore, genera XLS con `openpyxl`, lo sube a `gs://.../exports/{uid}/{timestamp}.xlsx` y devuelve URL prefirmada (5 min).
- `whatsapp_webhook` (HTTPS request): stub `200 ok`. Aquí vivirá toda la lógica del webhook + OCR + clasificación en una iteración futura.

## Próximos pasos

- Implementar el webhook real (Meta Cloud API / Twilio / Unipile)
- OCR del ticket (Document AI / Textract / etc.)
- Asignación de `ID_registro` consecutivo y cálculo de `Clasificacion_registro`
- Notificaciones automáticas al participante con el resultado
- UI para gestionar `sucursales_participantes` y `monto_minimo` (hoy se editan desde la consola)
