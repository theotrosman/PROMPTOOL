import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function comparePrompts(userPrompt, originalPrompt) {
  try {
    const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

    const prompt = `Eres un experto en prompts de generación de imágenes con IA. 

Compara estos dos prompts:

PROMPT ORIGINAL:
"${originalPrompt}"

PROMPT DEL USUARIO:
"${userPrompt}"

Analiza la similitud considerando:
- Elementos visuales
- Estilo y atmósfera
- Detalles técnicos
- Claridad

Devuelve SOLO un JSON válido así:

{
  "score": número entre 0 y 100,
  "explanation": "explicación clara en español (mínimo 4 oraciones)",
  "suggestions": "sugerencias concretas para mejorar (mínimo 3 oraciones)"
}`;

    console.log("🔍 DEBUG - Enviando prompt a Gemini...");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const textResponse = result.response.text();

    console.log("📝 DEBUG - Raw response:", textResponse);

    let parsed;

    try {
      parsed = JSON.parse(textResponse);
    } catch (err) {
      console.error("❌ ERROR - JSON inválido:", textResponse);
      throw new Error("La IA devolvió un formato inválido.");
    }

    if (
      typeof parsed.score !== "number" ||
      !parsed.explanation ||
      !parsed.suggestions
    ) {
      console.error("❌ ERROR - JSON incompleto:", parsed);
      throw new Error("Respuesta incompleta de la IA.");
    }

    console.log("🎉 DEBUG - Resultado final:", parsed);

    return {
      score: Math.min(100, Math.max(0, parsed.score)),
      explanation: parsed.explanation,
      suggestions: parsed.suggestions,
    };

  } catch (error) {
    console.error("❌ ERROR FINAL:", error);
    throw new Error("Error al analizar el prompt.");
  }
}