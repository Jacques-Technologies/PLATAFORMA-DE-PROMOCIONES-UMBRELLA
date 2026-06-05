async function handler(request, env) {
  const payload = await request.json();
  const vars = (payload && payload.execution_context && payload.execution_context.vars) || {};
  const raw = extractText(vars.trivia_resp);

  if (!raw) {
    return reply("wrong");
  }

  const normalized = raw.toLowerCase().trim();
  const letter = pickOptionLetter(normalized);

  return reply(letter === "a" ? "correct" : "wrong");
}

// Extrae la letra de opción (a/b/c) elegida.
// Soporta: "a", "A", "a) 2", "Selected: a) 2", "opcion a", "btn_a", "a)".
// Si no encuentra letra clara, devuelve null.
function pickOptionLetter(s) {
  // Quitar prefijo "selected:" típico de Kapso para botones
  const stripped = s.replace(/^selected:\s*/, "").trim();

  // Caso simple: el string es solo una letra
  if (/^[abc]$/.test(stripped)) return stripped;

  // "a) ...", "a)", "a." al inicio
  let m = stripped.match(/^([abc])[\)\.\s]/);
  if (m) return m[1];

  // "btn_a" / "btn-a" / "button_a"
  m = stripped.match(/^(?:btn|button)[_-]?([abc])$/);
  if (m) return m[1];

  // "opcion a" / "opción a"
  m = stripped.match(/\bopci(?:o|ó)n\s*([abc])\b/);
  if (m) return m[1];

  // Última heurística: la primera letra a/b/c aislada en el string
  m = stripped.match(/\b([abc])\b/);
  if (m) return m[1];

  return null;
}

function reply(edge) {
  return new Response(
    JSON.stringify({ next_edge: edge }),
    { headers: { "Content-Type": "application/json" } }
  );
}

function extractText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidates = [
      value.text,
      value.body,
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
