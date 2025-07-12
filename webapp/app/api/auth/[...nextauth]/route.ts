import { handlers } from "@/auth" 
// Custom GET handler
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Example: custom logic for /api/auth/custom
  if (url.pathname.endsWith("/api/auth/custom")) {
    return NextResponse.json({ message: "This is a custom GET response!" });
  }

  // Fallback to NextAuth.js default GET handler
  return handlers.GET(req);
}

export const { POST } = handlers;