import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMissionDebrief = async (score: number, enemiesDestroyed: number, durationSeconds: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Mission Log: Communication Systems Offline. Unable to retrieve HQ debriefing.";

  try {
    const prompt = `
      You are a tough, veteran fighter squadron commander. 
      Your pilot just returned from a mission.
      Here are the stats:
      - Score: ${score}
      - Enemies Destroyed: ${enemiesDestroyed}
      - Mission Duration: ${durationSeconds} seconds.

      Write a very short (max 2 sentences), thematic debriefing.
      If the score is low (< 1000), be harsh and critical about their lack of skill.
      If the score is medium (1000-5000), be mildly impressed but demand better.
      If the score is high (> 5000), be highly praising and call them an Ace.
      Do not use hashtags or markdown formatting like bolding. Just raw text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim() || "Transmission garbled...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Mission Log: Error retrieving data from HQ.";
  }
};
