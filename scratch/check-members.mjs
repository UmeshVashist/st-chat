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

async function test() {
  const { data: users } = await supabase.from("profiles").select("id, full_name, username");
  console.log("Users:", users);

  if (users && users.length > 0) {
    const userId = users[0].id;
    const res = await fetch(`http://localhost:3000/api/chat/conversations?userId=${userId}`);
    const json = await res.json();
    console.log("API response for user", users[0].full_name, ":", JSON.stringify(json, null, 2));
  }
}

test();
