import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET all conversations for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Get all conversation IDs user is member of
    const { data: memberRows, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (!memberRows || memberRows.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const convIds = memberRows.map((m) => m.conversation_id);

    // 2. Fetch conversations
    const { data: convs, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("last_message_at", { ascending: false });

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // 3. Fetch all members and profiles for these conversations
    const { data: allMembers, error: allMembersError } = await supabase
      .from("conversation_members")
      .select("*, profile:profiles(*)")
      .in("conversation_id", convIds);

    if (allMembersError) {
      console.error("Error loading conversation members:", allMembersError);
    }

    // 4. Fetch last message for each conversation
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    // Group members and last message by conversation
    const membersByConv: Record<string, any[]> = {};
    (allMembers || []).forEach((m) => {
      if (!membersByConv[m.conversation_id]) membersByConv[m.conversation_id] = [];
      membersByConv[m.conversation_id].push(m);
    });

    const lastMessageByConv: Record<string, any> = {};
    (recentMessages || []).forEach((msg) => {
      if (!lastMessageByConv[msg.conversation_id]) {
        lastMessageByConv[msg.conversation_id] = msg;
      }
    });

    const fullConversations = (convs || []).map((c) => {
      const convMembers = membersByConv[c.id] || [];
      const lastMsg = lastMessageByConv[c.id] || null;

      let displayName = c.name;
      let displayAvatar = c.avatar_url;
      let otherMemberProfile = null;

      if (c.type === "direct") {
        const otherMember = convMembers.find((m) => m.user_id !== userId);
        if (otherMember && otherMember.profile) {
          otherMemberProfile = otherMember.profile;
          displayName =
            otherMember.profile.full_name ||
            otherMember.profile.username ||
            otherMember.profile.phone_number ||
            "User";
          displayAvatar = otherMember.profile.avatar_url;
        }
      }

      // Find my member record to get last_read_at
      const myMember = convMembers.find((m) => m.user_id === userId);
      const myLastReadTime = myMember?.last_read_at
        ? new Date(myMember.last_read_at).getTime()
        : 0;

      // Count unread messages in this conversation sent by other users
      const unreadCount = (recentMessages || []).filter((msg) => {
        if (msg.conversation_id !== c.id) return false;
        if (msg.sender_id === userId) return false;
        const msgTime = new Date(msg.created_at).getTime();
        return msgTime > myLastReadTime;
      }).length;

      return {
        ...c,
        name: displayName,
        avatar_url: displayAvatar,
        other_user: otherMemberProfile,
        members: convMembers,
        last_message: lastMsg,
        unread_count: unreadCount,
      };
    });

    return NextResponse.json({ conversations: fullConversations });
  } catch (err: unknown) {
    console.error("Conversations GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation (direct or group)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, description, avatarUrl, createdBy, memberIds } = body;

    if (!createdBy || !memberIds || memberIds.length === 0) {
      return NextResponse.json(
        { error: "createdBy and memberIds are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // If direct chat, check if a direct conversation already exists between these 2 users
    if (type === "direct" && memberIds.length === 2) {
      const { data: existingMembers } = await supabase
        .from("conversation_members")
        .select("conversation_id, user_id")
        .in("user_id", memberIds);

      if (existingMembers && existingMembers.length >= 2) {
        const counts: Record<string, number> = {};
        existingMembers.forEach((m) => {
          counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
        });
        const matchId = Object.keys(counts).find((cid) => counts[cid] === 2);
        if (matchId) {
          // Check if it's direct
          const { data: existingConv } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", matchId)
            .eq("type", "direct")
            .maybeSingle();

          if (existingConv) {
            const { data: existingMembersWithProfiles } = await supabase
              .from("conversation_members")
              .select("*, profile:profiles(*)")
              .eq("conversation_id", existingConv.id);

            const otherMember = (existingMembersWithProfiles || []).find(
              (m) => m.user_id !== createdBy
            );
            const otherProfile = otherMember?.profile || null;

            return NextResponse.json({
              success: true,
              conversation: {
                ...existingConv,
                name:
                  type === "direct" && otherProfile
                    ? otherProfile.full_name ||
                      otherProfile.username ||
                      otherProfile.phone_number ||
                      existingConv.name
                    : existingConv.name,
                avatar_url:
                  type === "direct" && otherProfile
                    ? otherProfile.avatar_url
                    : existingConv.avatar_url,
                other_user: otherProfile,
                members: existingMembersWithProfiles || [],
                last_message: null,
                unread_count: 0,
              },
              isExisting: true,
            });
          }
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: type || "direct",
        name: name || null,
        description: description || null,
        avatar_url: avatarUrl || null,
        created_by: createdBy,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError || !newConv) {
      return NextResponse.json({ error: convError?.message || "Failed to create conversation" }, { status: 500 });
    }

    // Add members
    const allMembersToAdd = Array.from(new Set([createdBy, ...memberIds])).map((uid) => ({
      conversation_id: newConv.id,
      user_id: uid,
      role: uid === createdBy ? "admin" : "member",
    }));

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert(allMembersToAdd);

    if (membersError) {
      console.error("Error inserting members:", membersError);
    }

    // Fetch complete conversation with members and profiles
    const { data: memberDetails } = await supabase
      .from("conversation_members")
      .select("*, profile:profiles(*)")
      .eq("conversation_id", newConv.id);

    const otherMember = (memberDetails || []).find((m) => m.user_id !== createdBy);
    const otherProfile = otherMember?.profile || null;

    return NextResponse.json({
      success: true,
      conversation: {
        ...newConv,
        name:
          type === "direct" && otherProfile
            ? otherProfile.full_name ||
              otherProfile.username ||
              otherProfile.phone_number ||
              "Chat"
            : newConv.name,
        avatar_url:
          type === "direct" && otherProfile
            ? otherProfile.avatar_url
            : newConv.avatar_url,
        other_user: otherProfile,
        members: memberDetails || [],
        last_message: null,
        unread_count: 0,
      },
    });
  } catch (err: unknown) {
    console.error("Conversations POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete conversation
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);

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
