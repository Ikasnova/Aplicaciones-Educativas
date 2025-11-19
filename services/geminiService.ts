import { GoogleGenAI, Type } from "@google/genai";
import { EduApp, AIReview, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAppWithGemini = async (app: EduApp, lang: Language): Promise<AIReview> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const langInstruction = lang === 'eu' 
      ? "Responde en EUSKERA (Basque)." 
      : "Responde en ESPAÑOL.";

    const description = app.description[lang] || app.description['es'];

    const prompt = `
      Actúa como un experto tecnopedagógico y legal en educación.
      Analiza la siguiente aplicación educativa: "${app.name}" (${description}).
      
      ${langInstruction}
      
      Proporciona un análisis estructurado para un docente.
      
      IMPORTANTE: Presta especial atención al apartado de privacidad.
      Analiza si cumple con el RGPD (Reglamento General de Protección de Datos de la UE).
      Indica qué datos recoge del alumnado.
      Indica la edad mínima de uso recomendada o legal.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Resumen breve de valor pedagógico.",
            },
            teacherTip: {
              type: Type.STRING,
              description: "Consejo para el docente.",
            },
            studentActivity: {
              type: Type.STRING,
              description: "Idea de actividad para alumnos.",
            },
            pros: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 puntos fuertes.",
            },
            cons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 limitaciones.",
            },
            privacy: {
              type: Type.OBJECT,
              description: "Análisis de privacidad y protección de datos.",
              properties: {
                gdprCompliant: {
                  type: Type.BOOLEAN,
                  description: "Si cumple generalmente con RGPD (true/false).",
                },
                complianceSummary: {
                  type: Type.STRING,
                  description: "Breve explicación del estado de cumplimiento normativo.",
                },
                dataCollected: {
                  type: Type.STRING,
                  description: "Lista de datos que se recogen del alumno (ej: nombre, correo, progreso).",
                },
                ageWarning: {
                  type: Type.STRING,
                  description: "Texto breve sobre la edad mínima y requisitos parentales.",
                }
              },
              required: ["gdprCompliant", "complianceSummary", "dataCollected", "ageWarning"]
            }
          },
          required: ["summary", "teacherTip", "studentActivity", "pros", "cons", "privacy"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No se generó respuesta de la IA.");
    
    return JSON.parse(text) as AIReview;

  } catch (error) {
    console.error("Error fetching Gemini analysis:", error);
    throw error;
  }
};