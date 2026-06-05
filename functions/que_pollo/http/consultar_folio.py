"""Endpoint GET /consultar_folio: indica si un folio ya está registrado y VÁLIDO.

Query params:
    folio: string (obligatorio)
    campania: "jerseys" | "huevo_campeon" (obligatorio)

Response (200):
    { "exists": true | false }
"""

from __future__ import annotations

import json

from firebase_admin import firestore
from firebase_functions import https_fn
from google.cloud.firestore_v1.base_query import FieldFilter

from .. import firebase_app as _app  # noqa: F401
from .auth import KAPSO_API_KEY, require_api_key


def _bad_request(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"error": message}),
        status=400,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    region="us-central1",
    cpu=2,  # más CPU en el arranque → imports más rápidos (cobra solo activo)
    max_instances=10,
    memory=1024,
    timeout_sec=15,
    secrets=[KAPSO_API_KEY],
)
def consultar_folio(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error

    if req.method != "GET":
        return _bad_request("method_not_allowed")

    folio = req.args.get("folio")
    campania = req.args.get("campania")

    if not folio or campania not in ("jerseys", "huevo_campeon"):
        return _bad_request("invalid_query")

    db = firestore.client()
    query = (
        db.collection("registros")
        .where(filter=FieldFilter("campania", "==", campania))
        .where(filter=FieldFilter("Folio_ticket", "==", folio))
        .where(filter=FieldFilter("Clasificacion_registro", "==", "VALIDO"))
        .limit(1)
    )

    docs = list(query.stream())
    exists = len(docs) > 0

    payload: dict = {"exists": exists}
    if exists and req.args.get("include_doc"):
        snap = docs[0]
        d = snap.to_dict() or {}
        # Convertir timestamps a ISO para serializar
        for k, v in list(d.items()):
            if hasattr(v, "isoformat"):
                d[k] = v.isoformat()
        payload["doc"] = d
        payload["doc_id"] = snap.id

    return https_fn.Response(
        json.dumps(payload),
        status=200,
        headers={"Content-Type": "application/json"},
    )
