import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EventSuggestion } from "../types";

const parseEventSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_event: { type: Type.BOOLEAN, description: "True if the text describes a future event or meeting." },
    title: { type: Type.STRING, description: "A concise title for the event." },
    start: { type: Type.STRING, description: "ISO8601 start time. Assume current year/month if ambiguous." },
    end: { type: Type.STRING, description: "ISO8601 end time." },
    location: { type: Type.STRING, description: "Location of the event." },
    description: { type: Type.STRING, description: "Short description or context." },
    confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." }
  },
  required: ["is_event", "confidence"]
};

export const extractEventFromText = async (text: string): Promise<EventSuggestion | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key available for Gemini.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following chat message and determine if it proposes a schedule or event. 
      Current Date context: ${new Date().toISOString()}.
      Message: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: parseEventSchema,
        systemInstruction: "You are an assistant that extracts calendar events from chat messages. Be conservative. Only flag things as events if there is a clear intent to meet or do something at a specific time."
      }
    });

    const result = JSON.parse(response.text || "{}");

    if (result.is_event && result.confidence > 0.6) {
      return {
        title: result.title || "New Event",
        start: result.start || new Date().toISOString(),
        end: result.end,
        location: result.location,
        description: result.description,
        confidence: result.confidence
      };
    }
    return null;

  } catch (error) {
    console.error("Error extracting event:", error);
    return null;
  }
};
