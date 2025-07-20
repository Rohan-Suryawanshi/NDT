import express from "express";
import { generateProcedure } from "../controllers/Gemini.controller.js";

const router = express.Router();
router.post("/generate", generateProcedure);
export default router;
