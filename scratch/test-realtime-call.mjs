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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const clientA = createClient(SUPABASE_URL, SUPABASE_KEY);
const clientB = createClient(SUPABASE_URL, SUPABASE_KEY);

const userBId = "test-user-b-" + Date.now();
console.log("Subscribing Client B to user-calls:" + userBId);

const channelB = clientB.channel(`user-calls:${userBId}`, {
  config: { broadcast: { self: false } },
});

channelB.on("broadcast", { event: "incoming_call" }, (payload) => {
  console.log("Client B RECEIVED incoming_call payload:", payload);
  process.exit(0);
});

channelB.subscribe(async (status) => {
  console.log("Client B status:", status);
  if (status === "SUBSCRIBED") {
    console.log("Client A sending broadcast to user-calls:" + userBId);
    const channelA = clientA.channel(`user-calls:${userBId}`, {
      config: { broadcast: { self: false } },
    });

    channelA.subscribe(async (statusA) => {
      console.log("Client A status:", statusA);
      if (statusA === "SUBSCRIBED") {
        const res = await channelA.send({
          type: "broadcast",
          event: "incoming_call",
          payload: { test: "hello world" },
        });
        console.log("Client A send result:", res);
      }
    });
  }
});

setTimeout(() => {
  console.log("Timed out waiting for Client B to receive broadcast!");
  process.exit(1);
}, 8000);
