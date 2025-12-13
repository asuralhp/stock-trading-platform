import { llmBot } from "./crud";

export async function GET(req: Request) {
  const result = await llmBot("test", "test");
  return new Response(result);
}
