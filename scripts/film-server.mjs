import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "films", "trinity-styles");
const types = { ".html": "text/html", ".css": "text/css", ".png": "image/png" };

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const name = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const file = join(root, name === "." || name === "\\" || name === "/" ? "watch.html" : name);
  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(4173);
