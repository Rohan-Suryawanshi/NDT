// backend/src/routes/contact.routes.js
import express from 'express';
import { sendContactMessage } from '../controllers/ContactUs.controller.js';
const router = express.Router();


// POST /api/contact/send
router.post('/send', sendContactMessage);

module.exports = router;
