import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisType, CourseRecommendation } from "../types";

// Initialize the Gemini client
// The API key is automatically injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const courseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    courseName: { type: Type.STRING, description: "The name of the course" },
    courseCode: { type: Type.STRING, description: "The course code (e.g., CS101)" },
    credits: { type: Type.INTEGER, description: "Number of credits" },
    rating: { type: Type.INTEGER, description: "Relevance rating from 1 to 5" },
    reason: { type: Type.STRING, description: "Reason for recommendation in Korean. Explain what strength (from their A+ grades) this course matches." },
  },
  required: ["courseName", "courseCode", "credits", "rating", "reason"],
};

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: courseSchema,
};

export const analyzeTranscript = async (
  fileBase64: string,
  mimeType: string,
  analysisType: AnalysisType,
  userMajor: string
): Promise<CourseRecommendation[]> => {
  const typeLabel = analysisType === AnalysisType.GENERAL ? "General Education (교양)" : "Major (전공)";
  const majorContext = userMajor ? `The user is currently majoring in ${userMajor}.` : "The user has not specified a major.";
  
  const prompt = `
    You are an expert academic advisor specialized in maximizing GPA and matching learning styles.
    ${majorContext}
    
    Please analyze the attached image of a student's grade report/transcript deeply.

    1. **Identify Strengths**: Look for subjects where the student achieved high grades (A or A+).
    2. **Analyze Learning Style**: Based on these high-performing subjects, infer the student's learning style.
       - Example: High grades in Math/Physics -> Logical/Analytical learner.
       - Example: High grades in History/Literature -> Good at essay writing and rote memorization.
       - Example: High grades in Design/Art -> Creative/Visual learner.
    3. **Recommend**: Suggest 3 to 5 ${typeLabel} courses that strictly align with this identified learning style to ensure they can easily get a good grade again.
    
    For each recommendation, provide:
    - **Course Name**
    - **Course Code** (e.g., GEN 101, create a realistic one if not visible)
    - **Credits** (2 or 3)
    - **Rating** (1-5 stars based on "easiness" for this specific student)
    - **Reason**: Explicitly state *why* this suits them based on their past A+ grades (e.g., "Since you received an A+ in Calculus, this Logic course fits your analytical strengths."). Write this in Korean.

    Return the result strictly as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as CourseRecommendation[];
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw error;
  }
};