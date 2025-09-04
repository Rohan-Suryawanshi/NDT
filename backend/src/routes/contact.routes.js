// backend/src/routes/contact.routes.js
import express from 'express';
import { sendContactMessage, sendInspectorContactEmail } from '../controllers/ContactUs.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

// POST /api/contact/send
router.post('/send', sendContactMessage);

// POST /api/contact/send-inspector-contact-email
router.post('/send-inspector-contact-email', verifyJWT, sendInspectorContactEmail);

export default router;
