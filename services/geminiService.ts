import { EventSuggestion } from "../types";

/**
 * GEMINI EVENT EXTRACTION CLEANUP (social-v1.1.7)
 * 
 * Direct browser calls to Google Gemini are disabled for security (key exposure).
 * 
 * TODO: Migrate this logic to a Supabase Edge Function.
 * The frontend should call an RPC or Edge Function endpoint instead of initializing 
 * the Gemini SDK directly.
 */

export const extractEventFromText = async (_text: string): Promise<EventSuggestion | null> => {
  // Silent return to avoid console errors and prevent blocking message flow.
  // In Phase 1A, event extraction is out of scope for frontend implementation.
  return null;
};
