// Proxy thin: PATCH al doc para marcarlo como VÁLIDO al final del flujo (trivia correcta).
async function handler(request, env) {
  const payload = await request.json();
  const ctx = (payload && payload.execution_context) || {};
  const vars = (ctx && ctx.vars) || {};

  const id_registro = vars.id_registro;
  const campania = vars.campania_actual;
  if (!id_registro || (campania !== "jerseys" && campania !== "huevo_campeon")) {
    return new Response(
      JSON.stringify({ vars: { finalizar_error: "missing_args" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: mover a function-level secret cuando Kapso lo soporte.
  const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
  const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8";

  let res;
  try {
    res = await fetch(`${base}/actualizar_registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        id_registro,
        campania,
        clasificacion: "VALIDO",
        trivia: "yes",
      }),
    });
  } catch {
    return new Response(
      JSON.stringify({ vars: { finalizar_error: "fetch_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  let parsed;
  try {
    parsed = await res.json();
  } catch {
    return new Response(
      JSON.stringify({ vars: { finalizar_error: "invalid_response" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (!res.ok || !parsed || parsed.ok !== true) {
    return new Response(
      JSON.stringify({ vars: { finalizar_error: parsed && parsed.reason || "finalize_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ vars: { finalizar_error: null } }),
    { headers: { "Content-Type": "application/json" } }
  );
}
