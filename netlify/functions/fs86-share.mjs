import { randomBytes } from "node:crypto";

import { getStore } from "@netlify/blobs";

const STORE_NAME = "fs86-shares";
export const MAX_BLOB_BYTES = 64 * 1024;
const MAX_REQUEST_BYTES = MAX_BLOB_BYTES + 1024;
const SHORT_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/;
const SHARE_DATA_PATTERN = /^(?:fs1\.[A-Za-z0-9_-]+|f4\.[A-Za-z0-9._~-]+)$/;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function createShortId() {
  return randomBytes(9).toString("base64url");
}

function shortIdFromRequest(request, context) {
  if (typeof context?.params?.id === "string") return context.params.id;
  return new URL(request.url).searchParams.get("id") || "";
}

async function parseShareData(request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { error: json({ error: "Share data is too large" }, 413) };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return { error: json({ error: "Share data is too large" }, 413) };
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { error: json({ error: "Invalid JSON body" }, 400) };
  }

  if (typeof body?.data !== "string" || !SHARE_DATA_PATTERN.test(body.data)) {
    return { error: json({ error: "Invalid FS86 share data" }, 400) };
  }
  if (new TextEncoder().encode(body.data).byteLength > MAX_BLOB_BYTES) {
    return { error: json({ error: "Share data is too large" }, 413) };
  }

  return { data: body.data };
}

export function createShareHandler({
  storeFactory = () => getStore(STORE_NAME),
  idFactory = createShortId,
} = {}) {
  return async function handler(request, context = {}) {
    try {
      if (request.method === "POST") {
        const parsed = await parseShareData(request);
        if (parsed.error) return parsed.error;

        const store = storeFactory();
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const id = idFactory();
          if (!SHORT_ID_PATTERN.test(id)) {
            throw new Error("Short ID generator returned an invalid ID");
          }
          const result = await store.set(id, parsed.data, {
            onlyIfNew: true,
            metadata: {
              createdAt: new Date().toISOString(),
              format: parsed.data.slice(0, parsed.data.indexOf(".")),
            },
          });
          if (!result.modified) continue;

          const url = new URL("/create.html", request.url);
          url.searchParams.set("s", id);
          return json({ id, url: url.href }, 201);
        }

        return json({ error: "Could not create a unique share ID" }, 503);
      }

      if (request.method === "GET") {
        const id = shortIdFromRequest(request, context);
        if (!SHORT_ID_PATTERN.test(id)) {
          return json({ error: "Invalid share ID" }, 400);
        }

        const data = await storeFactory().get(id, {
          consistency: "strong",
          type: "text",
        });
        if (data === null) return json({ error: "Share not found" }, 404);
        if (!SHARE_DATA_PATTERN.test(data)) {
          return json({ error: "Stored share data is invalid" }, 422);
        }

        return json({ data });
      }

      return json({ error: "Method not allowed" }, 405);
    } catch (error) {
      console.error("FS86 share function failed", error);
      return json({ error: "Share service unavailable" }, 503);
    }
  };
}

export default createShareHandler();

export const config = {
  path: ["/api/fs86-share", "/api/fs86-share/:id"],
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
