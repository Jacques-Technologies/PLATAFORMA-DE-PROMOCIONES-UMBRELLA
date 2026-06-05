"""Endpoint POST /ocr_ticket: extrae datos de tickets/cupones con Gemini multimodal.

Body:
    { "image_url": "https://...", "campania": "jerseys" | "huevo_campeon" }

Response (200):
    Éxito: { "ok": true, "data": {...campos...} }
    OCR fallido o JSON inválido: { "ok": false, "reason": "ocr_failed" }
"""

from __future__ import annotations

import json
import re
from typing import Any

import requests
from firebase_functions import https_fn
from firebase_functions.params import SecretParam

from .. import firebase_app as _app  # noqa: F401
from .auth import KAPSO_API_KEY, require_api_key


GEMINI_API_KEY = SecretParam("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash-lite"

PROMPT_JERSEYS = """Eres un parser de tickets de compra de ¡Qué Pollo!. Analiza la imagen y extrae datos en JSON.

El ticket tiene columnas: CANT | DESCRIPCION | P.U. | IMPORTE
- CANT es la cantidad en kilogramos del producto en ESA MISMA LÍNEA.
- Las líneas de encabezado de sección como "PROMO JERSEYS" NO tienen kg propio; el número que aparece justo debajo pertenece al producto de esa siguiente línea.
- Cada línea de producto (BISTEK, pollo, etc.) lleva su propio número en la columna CANT.

Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta (sin texto adicional, sin markdown):
{
  "folio": "string con el número/código de folio del ticket",
  "sucursal": "nombre de la sucursal",
  "fecha_ticket": "fecha y hora en ISO 8601 (YYYY-MM-DDTHH:MM:SS)",
  "monto_ticket": número (total del ticket, sin símbolos),
  "items": [
    { "nombre": "descripción del producto tal como aparece en el ticket", "kg": número en kilogramos }
  ]
}

Reglas:
- Incluye TODOS los productos en `items`. Las líneas de sección/encabezado (ej. "PROMO JERSEYS") ponlas con kg=0.
- Si un producto no muestra peso en kg, usa 0.
- Si no puedes leer algún campo obligatorio (folio, sucursal, fecha_ticket, monto_ticket), responde con: { "error": "ocr_failed" }
- No inventes datos. Si no estás seguro, responde con error."""

PROMPT_HUEVO = """Eres un parser de cupones promocionales de "El Huevo Campeón" de Que Pollo. Analiza la imagen y extrae el folio, validando que sea un cupón auténtico.

Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta (sin texto adicional, sin markdown):
{
  "tiene_logo": true | false,
  "folio_cupon": "string con el número/código de folio del cupón"
}

Reglas para `tiene_logo`:
- El cupón auténtico tiene un logo "EL HUEVO CAMPEÓN" con tipografía deportiva, junto con elementos como pelota de fútbol, huevo, y/o el subtítulo "¡Qué pollo!". El cupón suele ser circular y holográfico/iridiscente.
- Sé tolerante: basta con que reconozcas el texto "EL HUEVO CAMPEÓN" o "¡Qué pollo!" o el logo característico aunque la foto esté arrugada, con reflejos o parcialmente cubierta.
- Solo responde `tiene_logo: false` si la imagen claramente NO es un cupón de esta promoción (por ejemplo, una foto cualquiera, otro producto, o un papel sin marca).

Reglas para `folio_cupon`:
- Es el número/código que aparece después de la palabra "FOLIO:".
- Si no puedes leer el folio, responde con: { "error": "ocr_failed" }
- No inventes datos."""


def _extract_json(text: str) -> dict[str, Any] | None:
    """Extrae el primer objeto JSON de la respuesta del modelo, tolerando code fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def _ok(payload: dict[str, Any]) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"ok": True, "data": payload}),
        status=200,
        headers={"Content-Type": "application/json"},
    )


def _failed(reason: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"ok": False, "reason": reason}),
        status=200,
        headers={"Content-Type": "application/json"},
    )


def _bad_request(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"error": message}),
        status=400,
        headers={"Content-Type": "application/json"},
    )


def _run_gemini(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    # Lazy import: el SDK de google-genai es pesado (~1-4s). Importándolo aquí
    # (y no a nivel módulo) lo sacamos del cold start de TODAS las funciones,
    # ya que main.py importa este módulo. Solo se carga en el primer OCR real.
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY.value)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0,
        ),
    )
    return response.text or ""


def _download_image(url: str) -> tuple[bytes, str]:
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    mime = r.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
    if not mime.startswith("image/"):
        mime = "image/jpeg"
    return r.content, mime


def _process_jerseys(parsed: dict[str, Any]) -> dict[str, Any] | None:
    required = ("folio", "sucursal", "fecha_ticket", "monto_ticket", "items")
    if not all(k in parsed and parsed[k] is not None for k in required):
        return None
    items = parsed.get("items") or []
    kg_bistec = 0.0
    for item in items:
        nombre = str(item.get("nombre", "")).upper()
        try:
            kg = float(item.get("kg") or 0)
        except (TypeError, ValueError):
            kg = 0.0
        if "BISTEC" in nombre or "BISTEK" in nombre:
            kg_bistec += kg
    return {
        "folio": str(parsed["folio"]),
        "sucursal": str(parsed["sucursal"]),
        "fecha_ticket": str(parsed["fecha_ticket"]),
        "monto_ticket": float(parsed["monto_ticket"]),
        "kg_bistec": round(kg_bistec, 3),
        "items": items,
    }


def _process_huevo(parsed: dict[str, Any]) -> dict[str, Any] | None:
    if not parsed.get("tiene_logo"):
        return None
    folio = parsed.get("folio_cupon")
    if not folio:
        return None
    return {"folio_cupon": str(folio)}


@https_fn.on_request(
    region="us-central1",
    cpu=2,  # más CPU en el arranque → imports más rápidos (cobra solo activo)
    max_instances=10,
    memory=1024,
    timeout_sec=60,
    secrets=[KAPSO_API_KEY, GEMINI_API_KEY],
)
def ocr_ticket(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error

    if req.method != "POST":
        return _bad_request("method_not_allowed")

    body = req.get_json(silent=True) or {}
    image_url = body.get("image_url")
    campania = body.get("campania")

    if not image_url or campania not in ("jerseys", "huevo_campeon"):
        return _bad_request("invalid_body")

    try:
        image_bytes, mime = _download_image(image_url)
    except requests.RequestException:
        return _failed("download_failed")

    prompt = PROMPT_JERSEYS if campania == "jerseys" else PROMPT_HUEVO

    try:
        raw = _run_gemini(prompt, image_bytes, mime)
    except Exception:
        return _failed("gemini_error")

    parsed = _extract_json(raw)
    if not parsed or parsed.get("error") == "ocr_failed":
        return _failed("ocr_failed")

    if campania == "jerseys":
        data = _process_jerseys(parsed)
    else:
        data = _process_huevo(parsed)

    if data is None:
        return _failed("ocr_failed")

    return _ok(data)
