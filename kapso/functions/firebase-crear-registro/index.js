async function handler(request, env) {
  const payload = await request.json();
  const ctx = (payload && payload.execution_context) || {};
  const vars = (ctx && ctx.vars) || {};
  const channel = (ctx && ctx.context) || {};

  const campania = vars.campania_actual;
  if (campania !== "jerseys" && campania !== "huevo_campeon") {
    return new Response(
      JSON.stringify({ vars: { crear_error: "campania_missing" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Body mínimo: el doc se crea como INVALIDO con solo nombre + whatsapp + campaña.
  // El resto de los campos se agregan vía firebase-actualizar-registro conforme avanza el flujo.
  const body = {
    campania,
    whatsapp: vars.whatsapp_registro || channel.phone_number || "",
    nombre: vars.nombre_registro || "",
  };

  // TODO: mover a function-level secret cuando Kapso lo soporte.
  const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
  const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8";

  let res;
  try {
    res = await fetch(`${base}/crear_registro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return new Response(
      JSON.stringify({ vars: { crear_error: "fetch_failed", id_registro: "" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  let parsed;
  try {
    parsed = await res.json();
  } catch {
    return new Response(
      JSON.stringify({ vars: { crear_error: "invalid_response", id_registro: "" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (!res.ok || !parsed || !parsed.id_registro) {
    return new Response(
      JSON.stringify({ vars: { crear_error: "create_failed", id_registro: "" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ vars: { id_registro: parsed.id_registro, crear_error: null } }),
    { headers: { "Content-Type": "application/json" } }
  );
}
