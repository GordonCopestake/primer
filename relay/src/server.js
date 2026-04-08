import http from "node:http";

import { createStableError } from "../../packages/schemas/src/index.js";
import { handleChatRoute } from "./routes/chat.js";
import { handleDirectorRoute } from "./routes/director.js";
import { handleImageRoute } from "./routes/image.js";
import { handleVisionRoute } from "./routes/vision.js";

const NOT_FOUND = {
  status: 404,
  headers: {
    "content-type": "application/json",
  },
  body: createStableError("route_not_found", "Route was not found."),
};

const METHOD_NOT_ALLOWED = {
  status: 405,
  headers: {
    "content-type": "application/json",
  },
  body: createStableError("method_not_allowed", "Only POST is supported."),
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const routeRequest = async (urlPath, body) => {
  if (urlPath === "/director") {
    return handleDirectorRoute(body);
  }

  if (urlPath === "/chat") {
    return handleChatRoute(body);
  }

  if (urlPath === "/image") {
    return handleImageRoute(body);
  }

  if (urlPath === "/vision") {
    return handleVisionRoute(body);
  }

  return NOT_FOUND;
};

export const createRelayServer = () =>
  http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, CORS_HEADERS);
      response.end();
      return;
    }

    if (request.method !== "POST") {
      response.writeHead(METHOD_NOT_ALLOWED.status, {
        ...METHOD_NOT_ALLOWED.headers,
        ...CORS_HEADERS,
      });
      response.end(JSON.stringify(METHOD_NOT_ALLOWED.body));
      return;
    }

    let bodyText = "";
    request.on("data", (chunk) => {
      bodyText += chunk;
    });

    request.on("end", async () => {
      try {
        const parsed = bodyText ? JSON.parse(bodyText) : {};
        const result = await routeRequest(new URL(request.url, "http://localhost").pathname, parsed);
        response.writeHead(result.status, {
          ...result.headers,
          ...CORS_HEADERS,
        });
        response.end(JSON.stringify(result.body));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json", ...CORS_HEADERS });
        response.end(
          JSON.stringify(createStableError("relay_internal_error", "Relay request failed.", String(error))),
        );
      }
    });
  });

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file://").href) {
  const port = Number(process.env.PRIMER_RELAY_PORT || 8787);
  createRelayServer().listen(port, () => {
    process.stdout.write(`Primer relay listening on http://localhost:${port}\n`);
  });
}
