import { START, Workflow } from "@kapso/workflows";

// Workflow: Campañas WhatsApp de Que Pollo
//   - A: Jerseys (60/sem × 10 sem = 600 totales)
//   - B: Huevo Campeón
// Mismo número de WhatsApp para ambas. Router inicial decide.
//
// El phone_number_id del trigger se setea con KAPSO_PHONE_NUMBER_ID al hacer build/push.
// Si no está definido, el workflow se publica sin trigger y se conecta manualmente.

const workflow = new Workflow("que-pollo-promociones", {
  name: "Que Pollo — Promociones",
  status: "draft",
});

const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
if (phoneNumberId) {
  workflow.addTrigger({ type: "inbound_message", phoneNumberId });
}

// =====================================================================
// Helpers (typed nodes)
// =====================================================================

const X_LEFT = 60;
const X_RIGHT = 720;

const sendText = (id, message, position) =>
  workflow.addNode(id, { type: "send_text", message }, { position });

const wait = (id, saveResponseTo, position) =>
  workflow.addNode(id, { type: "wait_for_response", saveResponseTo }, { position });

const setVar = (id, variableName, variableValue, position) =>
  workflow.addNode(
    id,
    { type: "set_variable", variableName, variableValue, valueType: "string" },
    { position }
  );

const decideFn = (id, functionSlug, conditions, position) =>
  workflow.addNode(
    id,
    { type: "decide", decisionType: "function", functionSlug, conditions },
    { position }
  );

const fnNode = (id, functionSlug, saveResponseTo, position) =>
  workflow.addNode(
    id,
    { type: "function", functionSlug, saveResponseTo },
    { position }
  );

const interactiveButtons = (id, bodyText, buttons, position) =>
  workflow.addNode(
    id,
    {
      type: "send_interactive",
      interactiveType: "button",
      bodyText,
      buttons,
      headerType: "none",
    },
    { position }
  );

const handoff = (id, reason, position) =>
  workflow.addNode(id, { type: "handoff", reason }, { position });

const edge = (source, target, label = "next") =>
  workflow.addEdge(source, target, { label });

// =====================================================================
// START + Router inicial
// =====================================================================

workflow.addNode(START, { position: { x: 380, y: 40} });

interactiveButtons(
  "send_interactive_menu",
  "¡Qué tal! ¿En qué te puedo ayudar?\n\nA) Participa por 1 de los 600 Jerseys\nB) Huevo Campeón (sólo si te salió el código promocional)\nC) Hablar con un agente",
  [
    { id: "a", title: "A) Jerseys" },
    { id: "b", title: "B) Huevo Campeón" },
    { id: "c", title: "C) Hablar con agente" },
  ],
  { x: 360, y: 160 }
);

wait("wait_opcion_inicial", "opcion_inicial", { x: 380, y: 280});

decideFn(
  "decide_router_ab",
  "decide-inicial-ab",
  [
    { label: "a", description: "Eligió Jerseys" },
    { label: "b", description: "Eligió Huevo Campeón" },
    { label: "c", description: "Eligió hablar con un agente humano" },
    { label: "invalid", description: "Respuesta no reconocida" },
  ],
  { x: 380, y: 400}
);

sendText(
  "send_text_menu_invalid",
  "Lo siento, no te entendí. Escribe A, B o C según la opción que quieras.",
  { x: 380, y: 520}
);

// Handoff a agente humano cuando el cliente elige la opción C.
sendText(
  "send_text_agente",
  "En un momento un agente estará contigo, gracias por esperar.",
  { x: 1100, y: 520 }
);

handoff("handoff_agente", "Cliente solicitó hablar con un agente humano", { x: 1100, y: 640 });

edge(START, "send_interactive_menu");
edge("send_interactive_menu", "wait_opcion_inicial");
edge("wait_opcion_inicial", "decide_router_ab");
edge("decide_router_ab", "send_text_menu_invalid", "invalid");
edge("send_text_menu_invalid", "wait_opcion_inicial");
edge("decide_router_ab", "send_text_agente", "c");
edge("send_text_agente", "handoff_agente");

// =====================================================================
// SUB-FLUJO A: JERSEYS
// =====================================================================

setVar("set_intentos_jersey", "intentos_ocr", "0", { x: 60, y: 660});

sendText(
  "send_text_jersey_bienvenida",
  "Bienvenido a Gana uno de los 60 Jerseys ¡Qué Pollo! de esta semana. Antes que nada, dime tu nombre para registrarte.",
  { x: 60, y: 780}
);

wait("wait_jersey_nombre", "nombre_registro", { x: 60, y: 900});

sendText(
  "send_text_jersey_pide_ticket",
  "Muy bien {{vars.nombre_registro}}, ahora sube una foto clara de tu ticket de compra.",
  { x: 60, y: 1020}
);

wait("wait_jersey_ticket", "archivo_ticket", { x: 60, y: 1140});

decideFn(
  "decide_jersey_ocr",
  "firebase-ocr-ticket",
  [
    { label: "ok", description: "OCR extrajo todos los campos" },
    { label: "failed", description: "OCR no logró leer el ticket" },
  ],
  { x: 60, y: 1260}
);

sendText(
  "send_text_jersey_ocr_retry",
  "No puedo detectar toda la información del ticket. Por favor sube otra foto, más clara.",
  { x: -320, y: 1340}
);

decideFn(
  "decide_jersey_intentos",
  "incrementar-intentos-ocr",
  [
    { label: "reintentar", description: "Aún quedan intentos" },
    { label: "agotados", description: "Llegó al máximo de 3 intentos" },
  ],
  { x: -320, y: 1460}
);

sendText(
  "send_text_jersey_ocr_fin",
  "Lo sentimos, no pudimos leer tu ticket tras varios intentos. Si quieres intentar de nuevo, escríbeme un mensaje nuevo y comenzamos otra vez.",
  { x: -660, y: 1620}
);

wait("wait_jersey_ticket_retry", "archivo_ticket", { x: -360, y: 1640});

sendText(
  "send_text_jersey_ocr_ok",
  "Gracias por tu compra en {{vars.sucursal}} el {{vars.fecha_ticket_legible}}.",
  { x: 60, y: 1380}
);

decideFn(
  "decide_jersey_folio",
  "firebase-consultar-folio",
  [
    { label: "exists", description: "Folio ya registrado y VÁLIDO" },
    { label: "not_exists", description: "Folio nuevo" },
  ],
  { x: 60, y: 1500}
);

sendText(
  "send_text_jersey_folio_dup",
  "El Ticket con folio {{vars.folio}} ya ha sido registrado antes y cada ticket sólo puede participar una vez. Escríbeme un mensaje para enviar un nuevo ticket.",
  { x: -100, y: 1640}
);

decideFn(
  "decide_jersey_kg",
  "decide-kg-suficiente",
  [
    { label: "yes", description: "Tiene >= 4kg de Bistec" },
    { label: "no", description: "Menos de 4kg de Bistec Marinado" },
  ],
  { x: 200, y: 1660}
);

sendText(
  "send_text_jersey_kg_no",
  "Lo sentimos, el ticket con folio {{vars.folio}} presenta {{vars.kg_bistec}}kg, debajo de los 4kg de Bistec Marinado necesarios para participar. Si tienes otro ticket, escríbeme un mensaje nuevo.",
  { x: -160, y: 1800}
);

interactiveButtons(
  "send_trivia_jersey",
  "Por favor contesta esta breve pregunta: ¿Cuántas patas tiene un pollo?",
  [
    { id: "a", title: "a) 2" },
    { id: "b", title: "b) 50" },
    { id: "c", title: "c) 100" },
  ],
  { x: 180, y: 1800}
);

wait("wait_jersey_trivia", "trivia_resp", { x: 60, y: 1940});

decideFn(
  "decide_jersey_trivia",
  "decide-trivia-correct",
  [
    { label: "correct", description: "Respondió la opción a" },
    { label: "wrong", description: "Respondió cualquier otra cosa" },
  ],
  { x: 40, y: 2060}
);

sendText(
  "send_text_jersey_trivia_wrong",
  "Lo sentimos, la respuesta es incorrecta. Si quieres intentarlo de nuevo, escríbeme un mensaje nuevo.",
  { x: -280, y: 2220}
);

// send_text_jersey_validando: feedback inmediato apenas el cliente sube la foto,
// porque el OCR de Gemini puede tardar 15-20s y la espera en silencio es mala UX.
sendText(
  "send_text_jersey_validando",
  "Estamos validando tu información, esto puede tomar un minuto.",
  { x: 60, y: 1200}
);

// fn_jersey_init: crea el doc INVALIDO mínimo apenas tenemos el nombre.
fnNode("fn_jersey_init", "firebase-crear-registro", "crear_result", { x: 60, y: 960 });

// fn_jersey_save_ocr: tras OCR exitoso, persiste folio+ticket data y dispara upload a GCS.
fnNode("fn_jersey_save_ocr", "firebase-actualizar-registro", "actualizar_result", { x: 60, y: 1320 });

// fn_jersey_crear: ahora marca VALIDO al final (mantenemos el ID del nodo por estabilidad de layout).
fnNode("fn_jersey_crear", "firebase-finalizar-registro", "finalizar_result", { x: 80, y: 2240});

sendText(
  "send_text_jersey_ok",
  "¡Respuesta correcta, {{vars.nombre_registro}}! Tu ticket ha sido registrado con el ID {{vars.id_registro}} y ya estás participando. Para conocer los ganadores de esta semana, ingresa a la página oficial de ¡Qué Pollo! ( https://www.facebook.com/share/1EGVGzr4Ro/ ) este próximo viernes a las 12 del día.",
  { x: 40, y: 2400}
);

// Edges Jerseys
edge("decide_router_ab", "set_intentos_jersey", "a");
edge("set_intentos_jersey", "send_text_jersey_bienvenida");
edge("send_text_jersey_bienvenida", "wait_jersey_nombre");
edge("wait_jersey_nombre", "fn_jersey_init");
edge("fn_jersey_init", "send_text_jersey_pide_ticket");
edge("send_text_jersey_pide_ticket", "wait_jersey_ticket");
edge("wait_jersey_ticket", "send_text_jersey_validando");
edge("send_text_jersey_validando", "decide_jersey_ocr");
edge("decide_jersey_ocr", "send_text_jersey_ocr_retry", "failed");
edge("send_text_jersey_ocr_retry", "decide_jersey_intentos");
edge("decide_jersey_intentos", "send_text_jersey_ocr_fin", "agotados");
edge("decide_jersey_intentos", "wait_jersey_ticket_retry", "reintentar");
edge("wait_jersey_ticket_retry", "send_text_jersey_validando");
// Optimización: chequear duplicado ANTES de persistir y de mandar "Gracias por tu compra...".
// Ahorra ~3-5s y evita decirle al cliente "estoy registrando" cuando vamos a rechazarlo.
edge("decide_jersey_ocr", "decide_jersey_folio", "ok");
edge("decide_jersey_folio", "send_text_jersey_folio_dup", "exists");
edge("decide_jersey_folio", "fn_jersey_save_ocr", "not_exists");
edge("fn_jersey_save_ocr", "send_text_jersey_ocr_ok");
edge("send_text_jersey_ocr_ok", "decide_jersey_kg");
edge("decide_jersey_kg", "send_text_jersey_kg_no", "no");
edge("decide_jersey_kg", "send_trivia_jersey", "yes");
edge("send_trivia_jersey", "wait_jersey_trivia");
edge("wait_jersey_trivia", "decide_jersey_trivia");
edge("decide_jersey_trivia", "send_text_jersey_trivia_wrong", "wrong");
edge("decide_jersey_trivia", "fn_jersey_crear", "correct");
edge("fn_jersey_crear", "send_text_jersey_ok");

// =====================================================================
// SUB-FLUJO B: HUEVO CAMPEÓN
// =====================================================================

setVar("set_intentos_huevo", "intentos_ocr", "0", { x: 720, y: 660});

sendText(
  "send_text_huevo_bienvenida",
  "Bienvenido a Huevo Campeón ¡Qué Pollo! ¿Cuál es tu nombre?",
  { x: 720, y: 780}
);

wait("wait_huevo_nombre", "nombre_registro", { x: 720, y: 900});

sendText(
  "send_text_huevo_pide_cupon",
  "¡Muy bien {{vars.nombre_registro}}! Ahora sube una foto clara de tu cupón ganador, de frente y que se lea el número de folio del cupón.",
  { x: 720, y: 1020}
);

wait("wait_huevo_cupon", "archivo_ticket", { x: 720, y: 1140});

decideFn(
  "decide_huevo_ocr",
  "firebase-ocr-ticket",
  [
    { label: "ok", description: "OCR detectó folio del cupón" },
    { label: "failed", description: "OCR no logró leer el cupón" },
  ],
  { x: 720, y: 1260}
);

sendText(
  "send_text_huevo_ocr_retry",
  "No puedo detectar la información del cupón. Por favor sube otra foto, más clara.",
  { x: 440, y: 1360}
);

decideFn(
  "decide_huevo_intentos",
  "incrementar-intentos-ocr",
  [
    { label: "reintentar", description: "Aún quedan intentos" },
    { label: "agotados", description: "Llegó al máximo de 3 intentos" },
  ],
  { x: 520, y: 1500}
);

sendText(
  "send_text_huevo_ocr_fin",
  "Lo sentimos, no pudimos leer tu cupón tras varios intentos. Si quieres intentar de nuevo, escríbeme un mensaje nuevo y comenzamos otra vez.",
  { x: 420, y: 1620}
);

wait("wait_huevo_cupon_retry", "archivo_ticket", { x: 720, y: 1620});

sendText(
  "send_text_huevo_ocr_ok",
  "Estoy registrando tu cupón con folio {{vars.folio}}.",
  { x: 1080, y: 1300}
);

decideFn(
  "decide_huevo_folio",
  "firebase-consultar-folio",
  [
    { label: "exists", description: "Folio del cupón ya registrado" },
    { label: "not_exists", description: "Folio nuevo" },
  ],
  { x: 1100, y: 1460}
);

sendText(
  "send_text_huevo_folio_dup",
  "El Folio {{vars.folio}} ya ha sido registrado antes y cada cupón sólo puede participar una vez. Escríbeme un mensaje para enviar un nuevo cupón.",
  { x: 980, y: 1600}
);

interactiveButtons(
  "send_trivia_huevo",
  "Por favor contesta esta breve pregunta: ¿Cuántos picos tiene un pollo?",
  [
    { id: "a", title: "a) 1" },
    { id: "b", title: "b) 10" },
    { id: "c", title: "c) 20" },
  ],
  { x: 1280, y: 1600}
);

wait("wait_huevo_trivia", "trivia_resp", { x: 720, y: 1740});

decideFn(
  "decide_huevo_trivia",
  "decide-trivia-correct",
  [
    { label: "correct", description: "Respondió la opción a" },
    { label: "wrong", description: "Respondió cualquier otra cosa" },
  ],
  { x: 720, y: 1860}
);

sendText(
  "send_text_huevo_trivia_wrong",
  "Lo sentimos, la respuesta es incorrecta. Si quieres intentarlo de nuevo, escríbeme un mensaje nuevo.",
  { x: 420, y: 1980}
);

// send_text_huevo_validando: feedback inmediato apenas el cliente sube la foto,
// porque el OCR de Gemini puede tardar 15-20s y la espera en silencio es mala UX.
sendText(
  "send_text_huevo_validando",
  "Estamos validando tu información, esto puede tomar un minuto.",
  { x: 720, y: 1200}
);

// fn_huevo_init: crea el doc INVALIDO mínimo apenas tenemos el nombre.
fnNode("fn_huevo_init", "firebase-crear-registro", "crear_result", { x: 720, y: 960 });

// fn_huevo_save_ocr: tras OCR exitoso, persiste folio_cupon y dispara upload a GCS.
fnNode("fn_huevo_save_ocr", "firebase-actualizar-registro", "actualizar_result", { x: 720, y: 1320 });

// fn_huevo_crear: ahora marca VALIDO al final.
fnNode("fn_huevo_crear", "firebase-finalizar-registro", "finalizar_result", { x: 720, y: 1980});

// decide_huevo_rango: valida que el folio del cupón esté en 1..50 (los únicos folios válidos impresos).
decideFn(
  "decide_huevo_rango",
  "decide-rango-cupon",
  [
    { label: "en_rango", description: "Folio numéricamente está entre 1 y 50" },
    { label: "fuera_rango", description: "Folio fuera del rango oficial" },
  ],
  { x: 720, y: 1430 }
);

sendText(
  "send_text_huevo_fuera_rango",
  "Lo sentimos, el folio {{vars.folio}} no corresponde a un cupón Huevo Campeón válido. Asegúrate de subir la foto del cupón oficial ¡Qué Pollo!",
  { x: 480, y: 1540 }
);

sendText(
  "send_text_huevo_ok",
  "Respuesta correcta, tu cupón ha sido registrado con el ID {{vars.id_registro}}, ¡FELICIDADES, eres un ganador en Huevo Campeón!. En breve te contactaremos para la entrega de tu premio.",
  { x: 720, y: 2100}
);

// Edges Huevo Campeón
edge("decide_router_ab", "set_intentos_huevo", "b");
edge("set_intentos_huevo", "send_text_huevo_bienvenida");
edge("send_text_huevo_bienvenida", "wait_huevo_nombre");
edge("wait_huevo_nombre", "fn_huevo_init");
edge("fn_huevo_init", "send_text_huevo_pide_cupon");
edge("send_text_huevo_pide_cupon", "wait_huevo_cupon");
edge("wait_huevo_cupon", "send_text_huevo_validando");
edge("send_text_huevo_validando", "decide_huevo_ocr");
edge("decide_huevo_ocr", "send_text_huevo_ocr_retry", "failed");
edge("send_text_huevo_ocr_retry", "decide_huevo_intentos");
edge("decide_huevo_intentos", "send_text_huevo_ocr_fin", "agotados");
edge("decide_huevo_intentos", "wait_huevo_cupon_retry", "reintentar");
edge("wait_huevo_cupon_retry", "send_text_huevo_validando");
// Optimización: rango (JS local) + folio (Firestore read) ANTES de persistir y de mandar
// "Estoy registrando tu cupón...". Ahorra ~3-5s y evita el mensaje engañoso en duplicados.
edge("decide_huevo_ocr", "decide_huevo_rango", "ok");
edge("decide_huevo_rango", "send_text_huevo_fuera_rango", "fuera_rango");
edge("decide_huevo_rango", "decide_huevo_folio", "en_rango");
edge("decide_huevo_folio", "send_text_huevo_folio_dup", "exists");
edge("decide_huevo_folio", "fn_huevo_save_ocr", "not_exists");
edge("fn_huevo_save_ocr", "send_text_huevo_ocr_ok");
edge("send_text_huevo_ocr_ok", "send_trivia_huevo");
edge("send_trivia_huevo", "wait_huevo_trivia");
edge("wait_huevo_trivia", "decide_huevo_trivia");
edge("decide_huevo_trivia", "send_text_huevo_trivia_wrong", "wrong");
edge("decide_huevo_trivia", "fn_huevo_crear", "correct");
edge("fn_huevo_crear", "send_text_huevo_ok");

export default workflow;
