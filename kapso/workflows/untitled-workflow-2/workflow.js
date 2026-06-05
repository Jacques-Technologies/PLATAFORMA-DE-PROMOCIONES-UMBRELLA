import { START, Workflow } from '@kapso/workflows';

const workflow = new Workflow("untitled-workflow-2", {
  name: "Untitled workflow (2)",
  status: "draft",
});

workflow.addNode(START, {
  "position": {
    "x": 100,
    "y": 100
  }
});

workflow.addNode("wait_for_response_1775483402369_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 1780
  },
  "displayName": "Wait for Response"
});

workflow.addNode("wait_for_response_1775433009557", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 380
  },
  "displayName": "Wait for Response"
});

workflow.addNode("send_text_1775433095695", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": "Si me compartes tu código postal reviso la fecha de entrega estimada",
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": -20,
    "y": 560
  },
  "displayName": "Send Text Message"
});

workflow.addNode("wait_for_response_1775433143928_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 680
  },
  "displayName": "Wait for Response"
});

workflow.addNode("send_text_1775433151334_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": "Perfecto, sería entre 5 a 7 días hábiles. ¿Cómo ves?",
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": 80,
    "y": 820
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1775433871685_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `¡Súper! Tu próximo sillón esta muy cerca🎉

¿Te ayudo a seguir buscando en nuestro catálogo?`,
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": 360,
    "y": 420
  },
  "displayName": "Send Text Message"
});

workflow.addNode("wait_for_response_1775433269888_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 960
  },
  "displayName": "Wait for Response"
});

workflow.addNode("wait_for_response_1775433284372_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 1240
  },
  "displayName": "Wait for Response"
});

workflow.addNode("send_text_1775433297028_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Va, tengo tu pedido listo, ¿algo más que te pueda hacer falta?
Tal vez, unos cojines que le combinen...`,
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": 60,
    "y": 1360
  },
  "displayName": "Send Text Message"
});

workflow.addNode("wait_for_response_1775433345185_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 1520
  },
  "displayName": "Wait for Response"
});

workflow.addNode("send_text_1775433533532_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Si todo es correcto, puedes hacer clic en esta liga realizar tu pago y procesaremos tu pedido.

https://demopage.com/order123`,
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": 80,
    "y": 1920
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1775433352061_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Muy bien. Te confirmo tu orden:
1x Sillón Aruba gris
1x Garantía por 2 años`,
    "delay_seconds": 0,
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_text",
  "type": "raw"
}, {
  "position": {
    "x": 60,
    "y": 1640
  },
  "displayName": "Send Text Message"
});

workflow.addNode("wait_for_response_1775433983509_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": null
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 380,
    "y": 600
  },
  "displayName": "Wait for Response"
});

workflow.addEdge("wait_for_response_1775483402369_0", "send_text_1775433533532_0");

workflow.addEdge("wait_for_response_1775433009557", "send_text_1775433871685_0");

workflow.addEdge("send_text_1775433095695", "wait_for_response_1775433143928_0");

workflow.addEdge("wait_for_response_1775433143928_0", "send_text_1775433151334_0");

workflow.addEdge("send_text_1775433151334_0", "wait_for_response_1775433269888_0");

workflow.addEdge("send_text_1775433871685_0", "wait_for_response_1775433983509_0");

workflow.addEdge("wait_for_response_1775433284372_0", "send_text_1775433297028_0");

workflow.addEdge("send_text_1775433297028_0", "wait_for_response_1775433345185_0");

workflow.addEdge("wait_for_response_1775433345185_0", "send_text_1775433352061_0");

workflow.addEdge("send_text_1775433352061_0", "wait_for_response_1775483402369_0");

workflow.addEdge("wait_for_response_1775433983509_0", "send_text_1775433095695");

export default workflow;
