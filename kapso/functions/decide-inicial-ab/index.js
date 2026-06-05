async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};
  const raw = extractText(vars.opcion_inicial);

  if (!raw) {
    return reply("invalid");
  }

  const normalized = stripAccents(raw.toLowerCase().trim());

  if (/^a\)?$/.test(normalized) || /\bjersey/.test(normalized)) {
    return reply("a", { campania_actual: "jerseys" });
  }
  if (/^b\)?$/.test(normalized) || /\bhuevo|\bcampeon/.test(normalized)) {
    return reply("b", { campania_actual: "huevo_campeon" });
  }
  if (/^c\)?$/.test(normalized) || /\bagente|\bhumano|\basesor/.test(normalized)) {
    return reply("c");
  }

  return reply("invalid");
}

function reply(edge, extraVars) {
  const responseBody = { next_edge: edge };
  if (extraVars) responseBody.vars = extraVars;
  return new Response(JSON.stringify(responseBody), {
    headers: { "Content-Type": "application/json" },
  });
}

function extractText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidates = [
      value.text,
      value.body,
      value.message,
      value.button_id,
      value.buttonId,
      value.id,
      value.button_reply && value.button_reply.id,
      value.interactive && value.interactive.button_reply && value.interactive.button_reply.id,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c;
    }
  }
  return null;
}

function stripAccents(s) {
  return s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}
