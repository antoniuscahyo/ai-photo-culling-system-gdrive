import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/gdrive";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const session = data.session;
      const user = session.user;
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;

      if (providerToken && user) {
        try {
          const db = admin();
          // Check if existing token exists to preserve refresh_token if not returned this time
          const { data: existing } = await db
            .from("user_gdrive_tokens")
            .select("refresh_token")
            .eq("user_id", user.id)
            .single();

          const refreshTokenToSave = providerRefreshToken || existing?.refresh_token;

          if (refreshTokenToSave) {
            await db.from("user_gdrive_tokens").upsert(
              {
                user_id: user.id,
                access_token: providerToken,
                refresh_token: refreshTokenToSave,
                expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          }
        } catch (err) {
          console.error("Failed to persist Google Drive token:", err);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
