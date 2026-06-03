import fs from 'fs';
import path from 'path';
import { indexSessionDocs } from '../services/ragPipeline.service.js';

const DOCS_DIR = './data/docs';

export const initializeInterviewKB = async () => {
  try {
    if (!fs.existsSync(DOCS_DIR)) {
      console.warn(`[DocumentIndexer] Documents directory ${DOCS_DIR} not found. Skipping KB initialization.`);
      return;
    }

    const files = fs.readdirSync(DOCS_DIR);
    console.log(`[DocumentIndexer] Found ${files.length} interview preparation documents.`);

    let totalChunks = 0;
    
    // We index the knowledge base under a special session ID: 'interview_prep_kb'
    const sessionId = 'interview_prep_kb';

    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(DOCS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Index this document
        const result = await indexSessionDocs(sessionId, fileContent, '', '');
        if (result.success) {
          totalChunks += result.count;
        }
      }
    }

    console.log(`[DocumentIndexer] Knowledge base 'interview_prep_kb' initialized successfully with ${totalChunks} chunks.`);
  } catch (err) {
    console.error('[DocumentIndexer] Failed to initialize knowledge base:', err.message);
  }
};
