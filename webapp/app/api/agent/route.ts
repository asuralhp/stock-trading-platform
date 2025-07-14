import { callAgent } from "./crud";

export async function GET(req: Request) {
  const result = await callAgent();
  return new Response(result);
}
