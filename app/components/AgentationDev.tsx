"use client";

import { Agentation } from "agentation";

/* Toolbar de anotaciones visuales (agentation.com) — solo en desarrollo.
   `endpoint` apunta al servidor HTTP de agentation-mcp (Agent Sync): las
   anotaciones llegan a Claude Code vía MCP sin copiar/pegar. */
export default function AgentationDev() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation endpoint="http://localhost:4747" />;
}
