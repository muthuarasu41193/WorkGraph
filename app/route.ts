import { getLandingHtml, landingHtmlResponse } from "@/lib/landing-html";

export async function GET() {
  const html = await getLandingHtml();
  return landingHtmlResponse(html);
}
