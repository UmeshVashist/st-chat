import { Conversation, Message, Profile } from "@/types/database";

// Pure types and empty defaults for production live data
export const MOCK_PROFILES: Profile[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];
export const INITIAL_MESSAGES: Record<string, Message[]> = {};
