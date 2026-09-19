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

const clientA = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const clientB = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const userAId = "userA-" + Date.now();
const userBId = "userB-" + Date.now();

let userBCallCount = 0;

// User B listens for incoming calls
const channelB = clientB.channel(`user-calls:${userBId}`, {
  config: { broadcast: { self: false } },
});

channelB.on("broadcast", { event: "incoming_call" }, (payload) => {
  userBCallCount++;
  console.log(`[User B] Received incoming_call #${userBCallCount}:`, payload.payload?.callId);

  // User B declines the call
  console.log("[User B] Declining call...");
  const replyChan = clientB.channel(`user-calls:${userAId}`);
  replyChan.subscribe((s) => {
    if (s === "SUBSCRIBED") {
      replyChan.send({
        type: "broadcast",
        event: "call_declined",
        payload: { callId: payload.payload?.callId },
      });
      console.log("[User B] Sent call_declined");
    }
  });
});

channelB.subscribe(async (statusB) => {
  if (statusB !== "SUBSCRIBED") return;
  console.log("[User B] Subscribed to own channel");

  // User A starts 1st call
  await makeCall(1);

  // Wait 3 seconds, then User A makes 2nd call
  setTimeout(async () => {
    console.log("\n--- Now User A makes 2nd call WITHOUT page reload ---");
    await makeCall(2);
  }, 3000);
});

async function makeCall(num) {
  const callId = `call-${num}-${Date.now()}`;
  console.log(`[User A] Making call #${num} (callId: ${callId})`);

  // If previous channel exists, remove it first
  const existing = clientA.getChannels().find((c) => c.topic === `realtime:user-calls:${userBId}`);
  if (existing) {
    console.log("[User A] Removing old channel instance before re-creating");
    await clientA.removeChannel(existing);
  }

  const targetChannel = clientA.channel(`user-calls:${userBId}`, {
    config: { broadcast: { self: false } },
  });

  targetChannel.subscribe((status) => {
    console.log(`[User A] targetChannel subscribe status: ${status}`);
    if (status === "SUBSCRIBED") {
      targetChannel.send({
        type: "broadcast",
        event: "incoming_call",
        payload: { callId, callerId: userAId },
      });
      console.log(`[User A] Sent call #${num}`);
    }
  });
}

setTimeout(() => {
  console.log(`\nFinal result: User B received ${userBCallCount} calls`);
  process.exit(userBCallCount === 2 ? 0 : 1);
}, 8000);
