import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_favorites",
  title: "Lista mina favoriter",
  description: "List the signed-in user's saved program events (Min Almedalsvecka) as id|day|start references.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("favorites").select("event_ref, updated_at").eq("saved", true).order("updated_at", { ascending: false }).limit(500);
    if (error) throw new ToolError("Kunde inte läsa favoriter.");
    const rows = (data ?? []).map((r) => ({ event_ref: r.event_ref, updated_at: r.updated_at }));
    return {
      content: [{ type: "text", text: rows.length ? rows.map((r) => r.event_ref).join("\n") : "Inga sparade programpunkter." }],
      structuredContent: { favorites: rows },
    };
  },
});
