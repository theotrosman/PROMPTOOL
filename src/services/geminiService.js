const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function comparePrompts(userPrompt, originalPrompt) {
  try {
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

    console.log("🚀 Enviando request a Groq...");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API ERROR:", data);
      throw new Error(data.error?.message || "Error en la API");
    }

    const textResponse = data.choices[0].message.content;

    console.log("📝 RAW:", textResponse);

    let parsed;

    try {
      parsed = JSON.parse(textResponse);
    } catch {
      // fallback por si mete texto extra
      const match = textResponse.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No vino JSON válido");
      parsed = JSON.parse(match[0]);
    }

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