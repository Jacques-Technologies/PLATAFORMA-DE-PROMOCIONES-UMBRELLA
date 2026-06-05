import { START, Workflow } from '@kapso/workflows';

const workflow = new Workflow("untitled-workflow-3", {
  name: "Untitled workflow (3)",
  status: "active",
});

workflow.addNode(START, {
  "position": {
    "x": 100,
    "y": 100
  }
});

workflow.addNode("send_interactive_1775520060795", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "interactive_type": "button",
    "body_text": "¿Cuántas patas tiene un pollo?",
    "footer_text": null,
    "header_config": {},
    "action_config": {
      "buttons": [
        {
          "id": "button_1775520100051",
          "title": "2"
        },
        {
          "id": "button_1775520106709",
          "title": "10"
        },
        {
          "id": "button_1775520110704",
          "title": "20"
        }
      ]
    },
    "header_type": "none",
    "buttons": [
      {
        "id": "button_1775520100051",
        "title": "2"
      },
      {
        "id": "button_1775520106709",
        "title": "10"
      },
      {
        "id": "button_1775520110704",
        "title": "20"
      }
    ],
    "provider_model_id": null,
    "provider_model_name": null,
    "ai_field_config": {},
    "to_phone_number": null
  },
  "nodeType": "send_interactive",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 800
  },
  "displayName": "Send Interactive Message"
});

workflow.addNode("send_text_1775519875854", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Hola Rafa, bienvenido a “QUÉ PASIÓN ¡QUÉ POLLO!, nos alegra mucho tu participación. Para poder registrar tu participación, necesito que me envíes una foto de tu ticket de compra. Con esa información podré extraer los datos necesarios y verificar todo para registrar tu participación. ¿Podrás compartir la foto de tu ticket de
compra conmigo?`,
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
    "y": 240
  },
  "displayName": "Send Text Message"
});

workflow.addNode("wait_for_response_1775519970940", {
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
    "y": 400
  },
  "displayName": "Wait for Response"
});

workflow.addNode("wait_for_response_1775520119057_0", {
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

workflow.addNode("send_text_1775519985116_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Perfecto, déjame revisar tu ticket de compra para extraer los datos.
`,
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
    "y": 520
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1775520145060_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": "Bien contestado ¡Tú registro está listo!",
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
    "y": 1100
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1776181284316_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": " Excelente, gracias por tu compra en sucursal Casa Blanca este 3 de Abril. Sólo falta 1 pregunta para registrar tu participación.",
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
    "y": 660
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1776181478760_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": "Este próximo viernes 15 de mayo se estarán comunicando los 60 ganadores de esta semana a través de la página de FB ¡Qué Pollo!",
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
    "y": 1220
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1776181497647_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `Sigue comprando y participando para ganar uno de los 600 Jerseys edición limitada ¡Qué Pollo!

Los participantes que contesten correctamente la pregunta y lo hagan en el menor tiempo, serán los ganadores. Recuerda, cada semana habrá 60 nuevos Jerseys que podrás ganar.`,
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
    "y": 1380
  },
  "displayName": "Send Text Message"
});

workflow.addNode("send_text_1776181527951_0", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": "Promoción valida hasta el 19 de julio del 2026",
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
    "y": 1520
  },
  "displayName": "Send Text Message"
});

workflow.addEdge("send_interactive_1775520060795", "wait_for_response_1775520119057_0");

workflow.addEdge(START, "send_text_1775519875854");

workflow.addEdge("send_text_1775519875854", "wait_for_response_1775519970940");

workflow.addEdge("wait_for_response_1775519970940", "send_text_1775519985116_0");

workflow.addEdge("wait_for_response_1775520119057_0", "send_text_1775520145060_0");

workflow.addEdge("send_text_1775519985116_0", "send_text_1776181284316_0");

workflow.addEdge("send_text_1775520145060_0", "send_text_1776181478760_0");

workflow.addEdge("send_text_1776181284316_0", "send_interactive_1775520060795");

workflow.addEdge("send_text_1776181478760_0", "send_text_1776181497647_0");

workflow.addEdge("send_text_1776181497647_0", "send_text_1776181527951_0");

export default workflow;
