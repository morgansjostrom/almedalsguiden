import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "set_favorite",
  title: "Spara eller ta bort favorit",
  description: "Save or unsave a program event in the signed-in user's Min Almedalsvecka, using its id|day|start reference.",
  inputSchema: {
    event_ref: z.string().min(3).max(200).regex(/^[^|]+\|[^|]+\|[^|]+$/).describe("Event reference in the form id|day|start."),
    saved: z.boolean().describe("true to save, false to remove."),
  },
  annotations: { idempotentHint: true, openWorldHint: false },
  handler: async ({ event_ref, saved }, ctx) => {
    const user_id = ctx.getUserId();
    if (!user_id) throw new ToolError("Inte inloggad.");
    const { error } = await supabaseForUser(ctx)
      .from("favorites").upsert({ user_id, event_ref, saved, updated_at: Date.now() }, { onConflict: "user_id,event_ref" });
    if (error) throw new ToolError("Kunde inte spara favoriten.");
    return { content: [{ type: "text", text: saved ? `Sparade ${event_ref}.` : `Tog bort ${event_ref}.` }] };
  },
});
