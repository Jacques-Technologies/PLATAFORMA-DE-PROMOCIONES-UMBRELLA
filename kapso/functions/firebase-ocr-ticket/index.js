async function handler(request, env) {
  const payload = await request.json();
  const ctx = (payload && payload.execution_context) || {};
  const vars = (ctx && ctx.vars) || {};
  const flowEvents = Array.isArray(payload && payload.flow_events) ? payload.flow_events : [];

  const campania = vars.campania_actual;
  if (campania !== "jerseys" && campania !== "huevo_campeon") {
    return new Response(
      JSON.stringify({ next_edge: "failed", vars: { ocr_error: "campania_missing" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const imageUrl = extractImageUrl(vars, flowEvents);
  if (!imageUrl) {
    return new Response(
      JSON.stringify({ next_edge: "failed", vars: { ocr_error: "image_url_missing" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: mover a function-level secret cuando Kapso lo soporte.
  const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
  const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8";
  let firebaseResponse;
  try {
    firebaseResponse = await fetch(`${base}/ocr_ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ image_url: imageUrl, campania }),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ next_edge: "failed", vars: { ocr_error: "fetch_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const text = await firebaseResponse.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(
      JSON.stringify({ next_edge: "failed", vars: { ocr_error: "invalid_response" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (!firebaseResponse.ok || body.ok !== true) {
    const reason = body.reason || body.error || `firebase_status_${firebaseResponse.status}`;
    return new Response(
      JSON.stringify({
        next_edge: "failed",
        vars: { ocr_error: reason, archivo_url: imageUrl },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const data = body.data || {};
  const newVars = { archivo_url: imageUrl, ocr_error: null };

  if (campania === "jerseys") {
    newVars.folio = data.folio || "";
    newVars.sucursal = data.sucursal || "";
    newVars.fecha_ticket = data.fecha_ticket || "";
    newVars.fecha_ticket_legible = formatFechaMX(data.fecha_ticket || "");
    newVars.monto_ticket = typeof data.monto_ticket === "number" ? data.monto_ticket : 0;
    newVars.kg_bistec = typeof data.kg_bistec === "number" ? data.kg_bistec : 0;
  } else {
    newVars.folio = data.folio_cupon || "";
  }

  return new Response(
    JSON.stringify({ next_edge: "ok", vars: newVars }),
    { headers: { "Content-Type": "application/json" } }
  );
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Formatea "YYYY-MM-DDTHH:MM:SS" (asumido hora MX) como "20 de abril de 2026 a las 08:19 hrs".
function formatFechaMX(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d, h, mi] = m;
  const mes = MESES_ES[parseInt(mo, 10) - 1] || mo;
  return `${parseInt(d, 10)} de ${mes} de ${y} a las ${h}:${mi} hrs`;
}

function extractImageUrl(vars, flowEvents) {
  const candidates = [
    vars.archivo_ticket,
    vars.archivo_url,
    vars.last_media_url,
    vars.media_url,
    vars.last_user_input,
  ];
  for (const c of candidates) {
    const url = pickUrl(c);
    if (url) return url;
  }
  for (const ev of flowEvents) {
    const url = pickUrl(ev && ev.payload);
    if (url) return url;
  }
  return null;
}

function pickUrl(value) {
  if (!value) return null;
  if (typeof value === "string") {
    // Kapso a menudo deja la URL embebida en un string como
    // "Image attached (...) URL: https://app.kapso.ai/.../image.jpeg".
    // Extraemos la primera URL http(s) que aparezca.
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
