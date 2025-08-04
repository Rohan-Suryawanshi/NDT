// controllers/geminiController.js
import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";

const API_KEYS = [
  "AIzaSyA1iZRWtgcH1f5hGAsvTGytHbGvyHtrTWM",
];

let currentKeyIndex = 0;
let totalTokenUsage = 0;
const MAX_TOKENS_PER_KEY = 1_000_000;

export const generateProcedure = async (req, res) => {
  const { userInput } = req.body;
  console.log(req.body);

  const config = {
    temperature: 1,
    tools: [{ googleSearch: {} }],
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: `You are a certified Non-Destructive Testing (NDT) expert with deep knowledge of industry standards like API 1104, ASTM E709, and E1444. Generate a detailed, professional-level NDT Procedure (SOP) for the following method and inputs. Follow the format and include practical, field-ready guidance in each section.

Include the following sections in your output:

1. Scope  
2. Reference Standards  
3. Personnel Qualification  
4. Equipment and Consumables  
5. Surface Preparation  
6. Technique and Parameters  
7. Evaluation and Interpretation  
8. Reporting and Documentation  
9. Safety and Precautions  

Inputs:  
- *Method*: Magnetic Particle Testing (MPT) using AC/DC Yoke  
- *Equipment*: Magnaflux Yoke, Model XYZ  
- *Power Source*: 230V AC or 12V DC  
- *Application*: Structural weld inspection  
- *Standards/Acceptance Criteria*: API 1104  
- *Consumables*: Magnaflux brand particles and cleaner  
- *Comments*: Use wet non-fluorescent method with aerosol-based application. Include proper lighting requirements, calibration checks, and demagnetization if needed.

The output must be formal, technical, and structured as a real inspection procedure ready to be used by Level II NDT technicians or included in a client's documentation system. generate the 10 to 12 pages procedure`,
      },
    ],
  };

  const contents = [
    {
      role: "user",
      parts: [{ text: userInput }],
    },
  ];

  while (currentKeyIndex < API_KEYS.length) {
    const ai = new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });
    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        config,
        contents,
      });

      let output = "";
      for await (const chunk of response) {
        output += chunk.text;
      }

      const estimatedTokens = Math.ceil(output.length / 4);
      totalTokenUsage += estimatedTokens;

      if (totalTokenUsage >= MAX_TOKENS_PER_KEY) {
        currentKeyIndex++;
        totalTokenUsage = 0;
      }

      console.log("Ans :"+output);
      const htmlOutput = marked.parse(output);
      console.log("Ans :" + htmlOutput);

      return res.json({ result: htmlOutput, tokensUsed: estimatedTokens });
    } catch (err) {
      if (
        err.message.includes("RESOURCE_EXHAUSTED") ||
        err.message.includes("quota")
      ) {
        currentKeyIndex++;
        totalTokenUsage = 0;
      } else {
        return res.status(500).json({ error: err.message });
      }
    }
  }

  

  return res.status(429).json({ error: "All API keys exhausted." });
};
