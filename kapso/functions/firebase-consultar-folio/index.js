async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};
  const folio = (vars.folio || "").toString().trim();
  const campania = vars.campania_actual;

  if (!folio || (campania !== "jerseys" && campania !== "huevo_campeon")) {
    return new Response(
      JSON.stringify({ next_edge: "not_exists", vars: { consulta_error: "missing_args" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: mover a function-level secret cuando Kapso lo soporte.
  const base = "https://us-central1-que-pollo-jtech.cloudfunctions.net";
  const apiKey = "c2230f66a8de25a20e38b04849ebc57a1cd70172e218ab133a08271be04b43e8";
  const url = `${base}/consultar_folio?folio=${encodeURIComponent(folio)}&campania=${encodeURIComponent(campania)}&include_doc=1`;

  let res;
  try {
    res = await fetch(url, { headers: { "X-API-Key": apiKey } });
  } catch {
    return new Response(
      JSON.stringify({ next_edge: "not_exists", vars: { consulta_error: "fetch_failed" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    return new Response(
      JSON.stringify({ next_edge: "not_exists", vars: { consulta_error: "invalid_response" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const exists = body && body.exists === true;
  const idRegistroExistente = exists && body.doc && body.doc.ID_registro
    ? String(body.doc.ID_registro)
    : "";

  return new Response(
    JSON.stringify({
      next_edge: exists ? "exists" : "not_exists",
      vars: { id_registro_existente: idRegistroExistente },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
