// ATTENTION : ce client utilise la clé service role.
// À n'importer QUE depuis app/api/ — jamais côté client ni dans les Server Components.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
