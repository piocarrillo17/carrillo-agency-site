import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function requireAgent(request: NextRequest): Promise<NextResponse | null> {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "An authorized agent account is required." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Request is too large. Use a smaller document." }, { status: 413 });
  }
  return null;
}
