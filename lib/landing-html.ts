import { readFile } from "node:fs/promises";
import path from "node:path";

export async function getLandingHtml(): Promise<string> {
  const htmlPath = path.join(process.cwd(), "index.html");
  return readFile(htmlPath, "utf8");
}

export function landingHtmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
