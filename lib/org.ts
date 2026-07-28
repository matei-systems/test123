import { createClient } from "@/lib/supabase/server";

export async function getCurrentOrg() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, org: null, role: null };

  const { data } = await supabase
    .from("memberships")
    .select("role, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const org = (data as any)?.organizations ?? null;
  return { user, org, role: (data as any)?.role ?? null };
}
