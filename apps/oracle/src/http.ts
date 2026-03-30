import type { OracleStore } from "./db/store";

export function startHealthServer(store: OracleStore, port: number, streamKeys: string[]) {
  return Bun.serve({
    port,
    fetch(request: Request) {
      const url = new URL(request.url);
      if (url.pathname === "/healthz") {
        return Response.json(store.health(streamKeys));
      }

      if (url.pathname === "/readyz") {
        const health = store.health(streamKeys);
        return Response.json(health, {
          status: health.ready ? 200 : 503
        });
      }

      return new Response("Not Found", { status: 404 });
    }
  });
}
