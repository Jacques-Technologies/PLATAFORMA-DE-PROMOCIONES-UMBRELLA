async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};
  const kg = Number(vars.kg_bistec);
  const sufficient = Number.isFinite(kg) && kg >= 4;
  return new Response(
    JSON.stringify({ next_edge: sufficient ? "yes" : "no" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
