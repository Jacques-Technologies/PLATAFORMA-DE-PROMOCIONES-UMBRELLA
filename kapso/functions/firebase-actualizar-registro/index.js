// Proxy thin: PATCH al doc en Firestore con los datos del ticket extraídos por OCR.
// Se invoca en el rama "ok" del decide_*_ocr (después de tener folio, sucursal, fecha, etc).
async function handler(request, env) {
  const payload = await request.json();
  const ctx = (payload && payload.execution_context) || {};
  const vars = (ctx && ctx.vars) || {};

  const id_registro = vars.id_registro;
  const campania = vars.campania_actual;
  if (!id_registro || (campania !== "jerseys" && campania !== "huevo_campeon")) {
    return new Response(
      JSON.stringify({ vars: { actualizar_error: "missing_args" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const body = { id_registro, campania };

  const archivoUrl = pickUrl(vars.archivo_ticket) || pickUrl(vars.archivo_url) || pickUrl(vars.last_user_input);
  if (archivoUrl) body.archivo_url = archivoUrl;

  if (vars.folio) body.folio = String(vars.folio);

  if (campania === "jerseys") {
    if (vars.sucursal) body.sucursal = String(vars.sucursal);
    if (vars.fecha_ticket) body.fecha_ticket = String(vars.fecha_ticket);
    if (vars.monto_ticket !== undefined && vars.monto_ticket !== null && vars.monto_ticket !== "") {
      body.monto_ticket = Number(vars.monto_ticket);
    }
    if (vars.kg_bistec !== undefined && vars.kg_bistec !== null && vars.kg_bistec !== "") {
      body.kg_bistec = Number(vars.kg_bistec);
    }
  }

  // TODO: mover a function-level secret cuando Kapso lo soporte.
  const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
  const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8";

  let res;
  try {
    res = await fetch(`${base}/actualizar_registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(body),
    });
  } catch {
    return new Response(
      JSON.stringify({ vars: { actualizar_error: "fetch_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  let parsed;
  try {
    parsed = await res.json();
  } catch {
    return new Response(
      JSON.stringify({ vars: { actualizar_error: "invalid_response" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (!res.ok || !parsed || parsed.ok !== true) {
    return new Response(
      JSON.stringify({ vars: { actualizar_error: parsed && parsed.reason || "update_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Re-emitimos las vars que ocupan los siguientes send_text para que Kapso
  // no las pierda entre pasos (vimos casos donde vars introducidas vía
  // response del OCR se "olvidan" y los {{vars.X}} se mandan literales).
  return new Response(
    JSON.stringify({
      vars: {
        actualizar_error: null,
        folio: vars.folio ? String(vars.folio) : "",
        sucursal: vars.sucursal ? String(vars.sucursal) : "",
        fecha_ticket_legible: vars.fecha_ticket_legible ? String(vars.fecha_ticket_legible) : "",
        kg_bistec: vars.kg_bistec === undefined || vars.kg_bistec === null || vars.kg_bistec === "" ? 0 : Number(vars.kg_bistec),
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

function pickUrl(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.match(/https?:\/\/\S+/i);
    if (!m) return null;
    return m[0].replace(/[)\],.;]+$/, "");
  }
  if (typeof value === "object") {
    return (
      pickUrl(value.url) ||
      pickUrl(value.media_url) ||
      pickUrl(value.link) ||
      pickUrl(value.public_url) ||
      pickUrl(value.signed_url) ||
      pickUrl(value.content) ||
      pickUrl(value.text) ||
      null
    );
  }
  return null;
}
