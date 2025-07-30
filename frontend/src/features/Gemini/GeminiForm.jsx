import React, { useRef, useState } from "react";
import JoditEditor from "jodit-react";
import { BACKEND_URL } from "@/constant/Global";
import { marked } from "marked";
const GeminiForm = () => {
   const editor = useRef(null);
   const [content, setContent] = useState("");
   const [userInput, setUserInput] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   const config = {
      readonly: false,
      placeholder: "Start typing or generate content...",
      height: 400,
   };

   const handleGenerateProcedure = async () => {
      setLoading(true);
      setError("");
      try {
         const response = await fetch(`${BACKEND_URL}/api/v1/gemini/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userInput }),
         });

         const data = await response.json();

         if (data?.result) {
            const htmlContent = marked(data.result || "");
            setContent(htmlContent);
         } else {
            setError("No content returned. Check input or server.");
         }
      } catch (err) {
         console.error("Gemini API error:", err);
         setError("Failed to generate content.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div style={{ padding: "1.5rem", margin: "auto" }}>
         <h2>🧪 NDT Procedure Generator</h2>

         {/* Prompt Guide */}
         <div
            style={{
               background: "#f8f9fa",
               border: "1px solid #e9ecef",
               borderRadius: "8px",
               padding: "1rem",
               marginBottom: "1.5rem",
            }}
         >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#495057" }}>
               💡 How to Write Effective Prompts
            </h3>
            <p
               style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.9rem",
                  color: "#6c757d",
               }}
            >
               Be specific about what you need. Here are some example:
            </p>
            <div style={{ fontSize: "0.85rem", color: "#495057" }}>
               <strong>Good Example:</strong>
               <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                  <li>
                     Generate a detailed NDT procedure based on the following
                     inputs:
                  </li>
                  <li>
                     <strong>Method:</strong> [e.g., Magnetic Particle Testing
                     (MPT) using AC/DC Yoke]
                  </li>
                  <li>
                     <strong>Equipment:</strong> [e.g., Magnaflux Yoke, Model
                     XYZ]
                  </li>
                  <li>
                     <strong>Power Source:</strong> [e.g., 230V AC or 12V DC]
                  </li>
                  <li>
                     <strong>Application:</strong> [e.g., Structural weld
                     inspection]
                  </li>
                  <li>
                     <strong>Standards/Acceptance Criteria:</strong> [e.g., API
                     1104]
                  </li>
                  <li>
                     <strong>Consumables:</strong> [e.g., Magnaflux brand
                     particles and cleaner]
                  </li>
                  <li>
                     <strong>Comments:</strong>
                  </li>
               </ul>
            </div>
         </div>

         <textarea
            type="text"
            placeholder="e.g., Create a radiographic testing procedure for welded steel pipes..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
               width: "100%",
               padding: "0.75rem",
               fontSize: "1rem",
               marginBottom: "1rem",
               border: "1px solid #ccc",
               borderRadius: "4px",
            }}
         />

         <button
            onClick={handleGenerateProcedure}
            disabled={loading || !userInput.trim()}
            style={{
               background: "#004aad ",
               color: "#fff",
               padding: "0.6rem 1.2rem",
               border: "none",
               borderRadius: "4px",
               cursor: "pointer",
            }}
         >
            {loading ? "Generating..." : "Generate"}
         </button>

         {error && (
            <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>
         )}

         <div style={{ marginTop: "1.5rem" }}>
            <JoditEditor
               className="w-full bg-amber-400"
               ref={editor}
               value={content}
               config={config}
               tabIndex={1}
               onBlur={(newContent) => setContent(newContent)}
               onChange={(newContent) => setContent(newContent)}
            />
         </div>
      </div>
   );
};

export default GeminiForm;
