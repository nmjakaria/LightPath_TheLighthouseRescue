/* Minimal static file server for the exported build. Node-only built-ins; no extra dependency.
 * Usage: npm run serve:static -- [directory] (defaults to ./.next-static), PORT to override 3200. */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? ".next-static");
const port = Number(process.env.PORT ?? 3200);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function insideRoot(candidate) {
  return candidate === root || candidate.startsWith(root + sep);
}

function findFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidates = [decoded, `${decoded}/index.html`, `${decoded}.html`];
  for (const candidate of candidates) {
    const file = resolve(root, `.${candidate}`);
    if (!insideRoot(file)) continue;
    try {
      if (statSync(file).isFile()) return file;
    } catch {
      // Try the next static-export filename convention.
    }
  }
  return null;
}

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = findFile(pathname);
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
