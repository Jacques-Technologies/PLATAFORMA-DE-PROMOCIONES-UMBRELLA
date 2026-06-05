async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};
  const current = Number(vars.intentos_ocr) || 0;
  const next = current + 1;
  const edge = next >= 3 ? "agotados" : "reintentar";
  return new Response(
    JSON.stringify({ next_edge: edge, vars: { intentos_ocr: next } }),
    { headers: { "Content-Type": "application/json" } }
  );
}
