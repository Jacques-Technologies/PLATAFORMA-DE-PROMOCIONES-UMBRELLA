"""Punto de entrada de Cloud Functions.

El runtime de Firebase Functions Python descubre las funciones por importación
(decoradores `@https_fn.*`, `@firestore_fn.*`, etc.) desde este archivo.
"""

from que_pollo.callables.export_registros_xls import export_registros_xls
from que_pollo.http.actualizar_registro import actualizar_registro
from que_pollo.http.consultar_folio import consultar_folio
from que_pollo.http.crear_registro import crear_registro
from que_pollo.http.migrar_archivos import migrar_archivos
from que_pollo.http.ocr_ticket import ocr_ticket
from que_pollo.http.whatsapp_webhook import whatsapp_webhook
from que_pollo.triggers.procesar_archivo_registro import procesar_archivo_registro

__all__ = [
    "actualizar_registro",
    "consultar_folio",
    "crear_registro",
    "export_registros_xls",
    "migrar_archivos",
    "ocr_ticket",
    "procesar_archivo_registro",
    "whatsapp_webhook",
]
