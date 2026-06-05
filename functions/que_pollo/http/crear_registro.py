"""Endpoint POST /crear_registro: crea un registro INVÁLIDO mínimo apenas el cliente da su nombre.

Body:
    {
      "campania": "jerseys" | "huevo_campeon",
      "whatsapp": "+52...",
      "nombre": "Juan"
    }

Response (200): { "id_registro": "<J-0000001>" }

El doc se crea con `Clasificacion_registro: "INVALIDO"` y `Trivia_registro: "no"`.
Los demás campos (folio, ticket data, archivo) se agregan después vía /actualizar_registro
conforme el flujo conversacional de Kapso avanza.
"""

from __future__ import annotations

import json
from typing import Any

from firebase_admin import firestore
from firebase_functions import https_fn
from google.cloud.firestore_v1.transaction import Transaction, transactional

from .. import firebase_app as _app  # noqa: F401
from .auth import KAPSO_API_KEY, require_api_key


ID_PREFIX = {"jerseys": "J", "huevo_campeon": "H"}
ID_WIDTH = {"jerseys": 7, "huevo_campeon": 3}


@transactional
def _next_registro_id(transaction: Transaction, counter_ref, prefix: str, width: int) -> str:
    snapshot = counter_ref.get(transaction=transaction)
    last = (snapshot.to_dict() or {}).get("last", 0) if snapshot.exists else 0
    nxt = int(last) + 1
    transaction.set(counter_ref, {"last": nxt})
    return f"{prefix}-{str(nxt).zfill(width)}"


def _bad_request(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"error": message}),
        status=400,
        headers={"Content-Type": "application/json"},
    )


def _build_doc(body: dict[str, Any]) -> dict[str, Any] | None:
    campania = body.get("campania")
    whatsapp = body.get("whatsapp")
    nombre = body.get("nombre")

    if campania not in ("jerseys", "huevo_campeon"):
        return None
    if not whatsapp or not nombre:
        return None

    return {
        "campania": campania,
        "Whatsapp_registro": str(whatsapp),
        "Nombre_registro": str(nombre),
        "Clasificacion_registro": "INVALIDO",
        "Trivia_registro": "no",
        "Fecha_registro": firestore.SERVER_TIMESTAMP,
    }


@https_fn.on_request(
    region="us-central1",
    cpu=2,  # más CPU en el arranque → imports más rápidos (cobra solo activo)
    max_instances=10,
    memory=1024,
    timeout_sec=15,
    secrets=[KAPSO_API_KEY],
)
def crear_registro(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error

    if req.method != "POST":
        return _bad_request("method_not_allowed")

    body = req.get_json(silent=True) or {}
    doc = _build_doc(body)
    if doc is None:
        return _bad_request("invalid_body")

    db = firestore.client()
    counter_ref = db.collection("counters").document(doc["campania"])
    prefix = ID_PREFIX[doc["campania"]]
    width = ID_WIDTH[doc["campania"]]
    id_registro = _next_registro_id(db.transaction(), counter_ref, prefix, width)
    doc["ID_registro"] = id_registro

    db.collection("registros").document().set(doc)

    return https_fn.Response(
        json.dumps({"id_registro": id_registro}),
        status=200,
        headers={"Content-Type": "application/json"},
    )
