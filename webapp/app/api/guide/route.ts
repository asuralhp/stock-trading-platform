import { NextResponse } from "next/server";

const DEV_GUIDE_URL = "http://localhost:3002";

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const requestUrl = new URL(request.url);
  const fallbackGuideUrl = `${requestUrl.origin}/guide`;
  const target = isDev
    ? DEV_GUIDE_URL
    : process.env.NEXT_PUBLIC_GUIDE_URL ?? fallbackGuideUrl;

  return NextResponse.redirect(target);
}
