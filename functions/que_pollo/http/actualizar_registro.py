"""Endpoint POST /actualizar_registro: patch incremental sobre un registro existente.

Body:
    {
      "id_registro": "J-0000007",       # obligatorio
      "campania": "jerseys"|"huevo_campeon",  # obligatorio (validación defensiva)

      # cualquier subset (campos opcionales):
      "archivo_url": "https://...",     # si llega y el doc no tiene Archivo_path,
                                        # se descarga la imagen y se sube a GCS.
      "folio": "ABC123",
      "sucursal": "Centro",             # solo jerseys
      "fecha_ticket": "2026-04-20T08:19:00",  # solo jerseys; ISO sin TZ → asume MX
      "monto_ticket": 250.5,            # solo jerseys
      "kg_bistec": 4.5,                 # solo jerseys
      "clasificacion": "VALIDO",        # marca el registro como válido al final
      "trivia": "yes"
    }

Response (200): { "ok": true } o { "ok": false, "reason": "..." }
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from firebase_admin import firestore
from firebase_functions import https_fn
from google.cloud.firestore_v1.base_query import FieldFilter

from .. import firebase_app as _app  # noqa: F401
from .auth import KAPSO_API_KEY, require_api_key


MX_TZ = ZoneInfo("America/Mexico_City")


def _bad_request(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"ok": False, "reason": message}),
        status=400,
        headers={"Content-Type": "application/json"},
    )


def _not_found(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"ok": False, "reason": message}),
        status=404,
        headers={"Content-Type": "application/json"},
    )


def _parse_iso(value: Any) -> datetime | None:
    """Parsea ISO 8601. Si no trae TZ, asume hora local de México."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=MX_TZ)
        return dt
    except ValueError:
        return None


def _build_updates(body: dict[str, Any]) -> dict[str, Any]:
    """Mapea claves del body (snake_case) a los campos del doc (Capital_snake)."""
    updates: dict[str, Any] = {}

    if "folio" in body and body["folio"] is not None:
        updates["Folio_ticket"] = str(body["folio"])

    if "sucursal" in body and body["sucursal"] is not None:
        updates["Sucursal_ticket"] = str(body["sucursal"])

    if "fecha_ticket" in body and body["fecha_ticket"]:
        parsed = _parse_iso(body["fecha_ticket"])
        if parsed is not None:
            updates["Fecha_ticket"] = parsed

    if "monto_ticket" in body and body["monto_ticket"] is not None:
        try:
            updates["Monto_ticket"] = float(body["monto_ticket"])
        except (TypeError, ValueError):
            pass

    if "kg_bistec" in body and body["kg_bistec"] is not None:
        try:
            updates["Kg_bistec"] = float(body["kg_bistec"])
        except (TypeError, ValueError):
            pass

    if "clasificacion" in body and body["clasificacion"] in ("VALIDO", "INVALIDO"):
        updates["Clasificacion_registro"] = body["clasificacion"]

    if "trivia" in body and body["trivia"] in ("yes", "no"):
        updates["Trivia_registro"] = body["trivia"]

    return updates


@https_fn.on_request(
    region="us-central1",
    cpu=2,  # más CPU en el arranque → imports más rápidos (cobra solo activo)
    max_instances=10,
    memory=1024,
    timeout_sec=15,
    secrets=[KAPSO_API_KEY],
)
def actualizar_registro(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error

    if req.method != "POST":
        return _bad_request("method_not_allowed")

    body = req.get_json(silent=True) or {}
    id_registro = body.get("id_registro")
    campania = body.get("campania")

    if not id_registro or campania not in ("jerseys", "huevo_campeon"):
        return _bad_request("invalid_body")

    db = firestore.client()
    # Buscar por ID_registro (campo). Es único globalmente por el prefix J-/H-.
    matches = list(
        db.collection("registros")
        .where(filter=FieldFilter("ID_registro", "==", str(id_registro)))
        .limit(1)
        .stream()
    )
    if not matches:
        return _not_found("registro_not_found")

    snap = matches[0]
    current = snap.to_dict() or {}

    # Validación defensiva: la campania del body debe coincidir con la persistida.
    if current.get("campania") != campania:
        return _bad_request("campania_mismatch")

    updates = _build_updates(body)

    # Solo registramos la URL externa; el upload a GCS lo hace el Firestore trigger
    # `procesar_archivo_registro` async para no bloquear el flow conversacional.
    archivo_url = body.get("archivo_url")
    if archivo_url and not current.get("Archivo_url_origen"):
        updates["Archivo_url_origen"] = str(archivo_url)

    if not updates:
        return https_fn.Response(
            json.dumps({"ok": True, "noop": True}),
            status=200,
            headers={"Content-Type": "application/json"},
        )

    snap.reference.update(updates)

    return https_fn.Response(
        json.dumps({"ok": True}),
        status=200,
        headers={"Content-Type": "application/json"},
    )
