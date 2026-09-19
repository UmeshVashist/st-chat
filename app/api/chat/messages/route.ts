import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET messages for a conversation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch messages and conversation members in parallel
    const [messagesRes, membersRes] = await Promise.all([
      supabase
        .from("messages")
        .select("*, sender:profiles(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversation_members")
        .select("user_id, last_read_at, role")
        .eq("conversation_id", conversationId),
    ]);

    if (messagesRes.error) {
      return NextResponse.json({ error: messagesRes.error.message }, { status: 500 });
    }

    const rawMessages = messagesRes.data || [];
    const members = membersRes.data || [];

    // Map each message with its accurate 1, 2, or 3 check status
    const messages = rawMessages.map((msg) => {
      // Find other members in the conversation
      const otherMembers = members.filter((m) => m.user_id !== msg.sender_id);

      let status: "sent" | "delivered" | "read" = "delivered";

      if (otherMembers.length > 0) {
        const msgTime = new Date(msg.created_at).getTime();

        // If any other member read at or after msg.created_at -> 'read' (3 checks)
        const isRead = otherMembers.some((m) => {
          if (!m.last_read_at) return false;
          return new Date(m.last_read_at).getTime() >= msgTime;
        });

        if (isRead) {
          status = "read";
        } else {
          // Delivered if stored in db for > 500ms, otherwise sent
          const isOlderThanASecond = Date.now() - msgTime > 500;
          status = isOlderThanASecond ? "delivered" : "sent";
        }
      }

      return {
        ...msg,
        status,
      };
    });

    return NextResponse.json({ messages });
  } catch (err: unknown) {
    console.error("Messages GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST: Send a message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, senderId, content, mediaUrl, mediaType, replyToId } = body;

    if (!conversationId || !senderId || (!content && !mediaUrl)) {
      return NextResponse.json(
        { error: "conversationId, senderId, and content or mediaUrl are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Insert message into PostgreSQL
    const { data: inserted, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content || "",
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        reply_to_id: replyToId || null,
        created_at: new Date().toISOString(),
      })
      .select("*, sender:profiles(*)")
      .single();

    if (insertError || !inserted) {
      console.error("Insert message error:", insertError);
      return NextResponse.json({ error: insertError?.message || "Failed to send message" }, { status: 500 });
    }

    // 2. Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: inserted.created_at })
      .eq("id", conversationId);

    return NextResponse.json({
      success: true,
      message: { ...inserted, status: "delivered" },
    });
  } catch (err: unknown) {
    console.error("Messages POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a message
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("messages").delete().eq("id", messageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// PATCH: Edit a message
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json({ error: "messageId and content are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("messages")
      .update({ content, is_edited: true, updated_at: new Date().toISOString() })
      .eq("id", messageId)
      .select("*, sender:profiles(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
