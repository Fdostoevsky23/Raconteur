// src/lib/supabase-write.ts — raw REST write helper for interactive forms.
// supabase-js clients created at page-load time on some skins can delay or
// wedge their first write while the shell's auth traffic settles, which read
// as "the form does nothing". This helper posts straight to PostgREST with
// the anon key and the reader's session token: same tables, same RLS,
// same result — minus the wedging layer.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY — check .env");
}

// Imported lazily so callers never block on the shared client at module scope.
async function sessionToken(): Promise<string> {
    try {
        const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
        const { supabase } = await dynImport("/src/lib/supabase.ts");
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? supabaseAnonKey;
    } catch {
        return supabaseAnonKey;
    }
}

export async function restInsert(
    table: string,
    payload: Record<string, unknown>,
    opts: { single?: boolean } = {},
): Promise<{ data: any; error: { message: string } | null }> {
    try {
        const token = await sessionToken();
        const headers: Record<string, string> = {
            apikey: supabaseAnonKey,
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        };
        if (opts.single) headers["Accept"] = "application/vnd.pgrst.object+json";
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            let message = "Request failed (" + res.status + ")";
            try {
                const body = await res.json();
                if (body.message) message = body.message;
            } catch { /* non-json error body */ }
            return { data: null, error: { message } };
        }
        const data = await res.json().catch(() => null);
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: { message: e?.message || "Network error" } };
    }
}
