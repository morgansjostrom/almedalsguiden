import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFavorites from "./tools/list-favorites";
import setFavorite from "./tools/set-favorite";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "almedalskompassen",
  title: "Almedalskompassen",
  version: "0.1.0",
  instructions: "Tools for Almedalskompassen. Read and update the signed-in visitor's saved program events (Min Almedalsvecka). Events are referenced as id|day|start.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listFavorites, setFavorite],
});
