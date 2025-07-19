import { llmBot } from "./crud";

export async function GET(req: Request) {
  const result = await llmBot();
  return new Response(result);
}
