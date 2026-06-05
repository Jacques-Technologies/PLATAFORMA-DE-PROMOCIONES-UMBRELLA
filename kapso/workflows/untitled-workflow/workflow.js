import { START, Workflow } from '@kapso/workflows';

const workflow = new Workflow("untitled-workflow", {
  name: "Untitled workflow",
  status: "draft",
});

workflow.addNode(START, {
  "position": {
    "x": 100,
    "y": 100
  }
});

workflow.addNode("wait_for_response_1775262356662_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": "primera-preg2"
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 760
  },
  "displayName": "Wait for Response"
});

workflow.addNode("agent_1775261984651", {
  "config": {
    "system_prompt": `Eres parte del equipo de ¡Qué pollo! 

Eres un asistente inteligente de whatsapp enfocado en ayudar a validar una promoción en sucursal.

La conversación inició porque al cliente le trajeron la cuenta y un QR que escaneo donde inició esta conversación por whatsapp.

Tu trabajo es saludarlo y pedir el ticket en foto donde puedas validar y extraer la fecha, sucursal y monto total.

Cuando logras extraer estos datos le agradeces por su compra en {sucursal} y le comentas que solo faltan 3 preguntas para que reciba su promoción.

Ahí termina tu tarea. En cuanto tengas la información termina la tarea para que continue. No esperes respuesta final del cliente.`,
    "provider_model_id": "8c6d57df-3f07-4290-b8a5-38047608c4df",
    "provider_model_name": "claude-haiku-4-5",
    "temperature": "0.1",
    "max_iterations": 15,
    "max_tokens": 4000,
    "reasoning_effort": null,
    "observer_prompt_mode": "analysis_only",
    "enabled_default_tools": [
      "send_notification_to_user",
      "send_media",
      "get_execution_metadata",
      "get_whatsapp_context",
      "get_current_datetime",
      "save_variable",
      "get_variable",
      "ask_about_file",
      "enter_waiting",
      "complete_task",
      "handoff_to_human"
    ],
    "sandbox_enabled": false,
    "sandbox_network_mode": "allow_all",
    "sandbox_allowed_outbound_hosts": [],
    "flow_agent_function_tools": [],
    "flow_agent_app_integration_tools": [],
    "flow_agent_webhooks": [],
    "flow_agent_knowledge_bases": [],
    "flow_agent_mcp_servers": [],
    "flow_agent_resources": []
  },
  "nodeType": "agent",
  "type": "raw"
}, {
  "position": {
    "x": 60,
    "y": 260
  },
  "displayName": "AI Agent"
});

workflow.addNode("wait_for_response_1775262306364", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": "primera-preg"
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 520
  },
  "displayName": "Wait for Response"
});

workflow.addNode("wait_for_response_1775262394004_0", {
  "config": {
    "has_timeout": false,
    "timeout_seconds": null,
    "save_response_to": "primera-preg2"
  },
  "nodeType": "wait_for_response",
  "type": "raw"
}, {
  "position": {
    "x": 100,
    "y": 1060
  },
  "displayName": "Wait for Response"
});

workflow.addNode("send_text_1775262400849", {
  "config": {
    "whatsapp_config_id": null,
    "phone_number_id": null,
    "message": `¡Tu promoción esta lista! Muestra este mensaje a tu mesero.

Promoción válida hasta el 4 de Abril de 2026`,
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
    "y": 1200
  },
  "displayName": "Send Text Message"
});

workflow.addEdge(START, "agent_1775261984651");

workflow.addEdge("wait_for_response_1775262394004_0", "send_text_1775262400849");

export default workflow;
