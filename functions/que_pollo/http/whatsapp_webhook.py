"""Webhook stub para integraciones con WhatsApp.

Aquí vivirá la lógica completa en una iteración posterior:
- Verificación del token (Meta Cloud API / Twilio / Unipile)
- Descarga del media (foto del ticket) → Storage en /tickets/
- OCR del ticket (Document AI / Textract / etc.)
- Asignación de ID_registro consecutivo (J-0000000)
- Cálculo de Clasificacion_registro según las 4 reglas
- Persistencia del documento en /registros/

Por ahora responde 200 para que el endpoint quede registrado.
"""

from __future__ import annotations

from firebase_functions import https_fn

from .. import firebase_app as _app  # noqa: F401


@https_fn.on_request(region="us-central1", max_instances=10)
def whatsapp_webhook(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("ok", status=200)
