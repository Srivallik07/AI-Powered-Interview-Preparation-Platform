import express from 'express';
import multer from 'multer';
import { extractTextFromBuffer, parseResumeText } from '../services/resumeParser.service.js';
import { protect } from '../middleware/auth.middleware.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// Multer memory storage configuration (keeps disk storage empty and clean)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT are supported.'));
    }
  }
});

// @route   POST /api/resume/parse
// @desc    Upload and parse resume file
// @access  Private
router.post(
  '/parse',
  protect,
  upload.single('resume'),
  auditLogger('Resume Upload & Parse'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a resume file' });
      }

      console.log(`Parsing file: ${req.file.originalname} (${req.file.mimetype})`);

      // Extract raw text
      const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
      
      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Could not extract text from the file.' });
      }

      // Structure with LLM / Mock
      const structuredData = await parseResumeText(rawText);

      res.json({
        success: true,
        filename: req.file.originalname,
        textLength: rawText.length,
        rawText: rawText, // return raw text so it can be saved in the session context
        parsedData: structuredData
      });
    } catch (error) {
      console.error('Resume upload parsing error:', error.message);
      res.status(500).json({
        success: false,
        message: `Parsing failed: ${error.message}`
      });
    }
  }
);

export default router;
