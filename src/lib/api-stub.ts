// Migration phase 1: no accounts and an empty database. Endpoints keep the original
// JSON contracts in their signed-out state. Writes are refused until verified auth exists.
export const json = (data: unknown, status = 200, cache = "no-store") =>
  Response.json(data, { status, headers: { "Cache-Control": cache } });

export const sameOrigin = (request: Request) =>
  request.headers.get("origin") === new URL(request.url).origin;

export const refuseWrite = (request: Request, message = "Inloggning krävs") =>
  sameOrigin(request) ? json({ error: message }, 401) : json({ error: "Otillåten källa" }, 403);
