export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  phone_number: string | null;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  about: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
  other_user?: Profile | null;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "member" | "admin";
  last_read_at: string;
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  media_url: string | null;
  media_type: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  status?: "sent" | "delivered" | "read";
  sender?: Profile;
  reply_to?: Message;
}

export interface Call {
  id: string;
  room_id: string;
  conversation_id: string | null;
  caller_id: string | null;
  call_type: "audio" | "video";
  status: "initiated" | "ringing" | "active" | "ended" | "missed" | "rejected";
  duration_seconds: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  caller?: Profile;
  participants?: CallParticipant[];
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  status: "invited" | "accepted" | "rejected" | "left";
  joined_at: string | null;
  left_at: string | null;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation>;
        Update: Partial<Conversation>;
      };
      conversation_members: {
        Row: ConversationMember;
        Insert: Partial<ConversationMember> & { conversation_id: string; user_id: string };
        Update: Partial<ConversationMember>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & { conversation_id: string; content: string };
        Update: Partial<Message>;
      };
      calls: {
        Row: Call;
        Insert: Partial<Call> & { room_id: string };
        Update: Partial<Call>;
      };
      call_participants: {
        Row: CallParticipant;
        Insert: Partial<CallParticipant> & { call_id: string; user_id: string };
        Update: Partial<CallParticipant>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; title: string; body: string };
        Update: Partial<Notification>;
      };
    };
  };
}
