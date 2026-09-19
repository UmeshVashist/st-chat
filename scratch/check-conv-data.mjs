import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .map((l) => l.trim().split("="))
    .filter((parts) => parts.length >= 2)
    .map(([k, ...v]) => [k.trim(), v.join("=").trim().replace(/^["']|["']$/g, "")])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: convs, error } = await supabase
    .from("conversations")
    .select(`
      id,
      name,
      type,
      conversation_members (
        user_id,
        profiles (
          id,
          full_name,
          username
        )
      )
    `)
    .limit(5);

  console.log("Conversations sample:", JSON.stringify(convs, null, 2));
}

check();
