// Valida que el folio del cupón Huevo Campeón esté en el rango 1..50.
// Robusto a cualquier formato de input ("001", "0001", "000001", "Folio: 042", etc.):
// extrae todos los dígitos y los parsea como entero.
async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};

  const raw = (vars.folio || "").toString();
  // Toma la primera secuencia de dígitos del string.
  const match = raw.match(/\d+/);
  if (!match) {
    return reply("fuera_rango", { folio_invalido: raw });
  }

  const num = parseInt(match[0], 10);
  if (Number.isFinite(num) && num >= 1 && num <= 50) {
    return reply("en_rango");
  }

  return reply("fuera_rango", { folio_invalido: raw });
}

function reply(edge, extraVars) {
  const body = { next_edge: edge };
  if (extraVars) body.vars = extraVars;
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
