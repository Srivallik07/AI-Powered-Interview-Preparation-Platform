import dotenv from 'dotenv';
import { ChatGroq } from '@langchain/groq';

dotenv.config();

// Simple in-memory fallback Vector Store if ChromaDB is not available
class InMemoryVectorStore {
  constructor() {
    this.stores = {}; // sessionId -> arrays of { text, metadata }
  }

  async addDocuments(sessionId, docs) {
    if (!this.stores[sessionId]) {
      this.stores[sessionId] = [];
    }
    this.stores[sessionId].push(...docs);
    console.log(`InMemoryRAG: Indexed ${docs.length} chunks for session ${sessionId}`);
  }

  async similaritySearch(sessionId, query, k = 3) {
    const docs = this.stores[sessionId] || [];
    if (docs.length === 0) return [];

    // Simple word-overlap/containment search as a simple similarity scorer
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scoredDocs = docs.map(doc => {
      const docText = doc.text.toLowerCase();
      let score = 0;
      queryTerms.forEach(term => {
        if (docText.includes(term)) {
          score += 1;
        }
      });
      return { doc, score };
    });

    // Sort by score descending and return top k
    return scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  }
}

const memoryStore = new InMemoryVectorStore();

// Config retriever for local or cloud ChromaDB
const getChromaConfig = () => {
  const host = process.env.CHROMA_HOST || 'localhost:8000';
  const protocol = host.startsWith('http') ? '' : (host.includes('trychroma.com') ? 'https://' : 'http://');
  const baseUrl = `${protocol}${host}`;
  const apiKey = process.env.CHROMA_API_KEY || '';
  const tenant = process.env.CHROMA_TENANT || 'default_tenant';
  const database = process.env.CHROMA_DATABASE || 'default_database';

  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['X-Chroma-Token'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const queryParams = `?tenant=${tenant}&database=${database}`;

  return { baseUrl, headers, queryParams };
};

// Core pipeline class
export const indexSessionDocs = async (sessionId, resumeText, jdText, companyProfile = '') => {
  const { baseUrl, headers, queryParams } = getChromaConfig();
  
  // Create clean chunks
  const chunks = [];
  
  // Chunk helper
  const addChunks = (text, type) => {
    if (!text) return;
    const splitText = text.split(/\n\n+/);
    splitText.forEach((paragraph, idx) => {
      if (paragraph.trim().length > 20) {
        chunks.push({
          text: paragraph.trim(),
          metadata: { sessionId, type, chunkId: `${type}_${idx}` }
        });
      }
    });
  };

  addChunks(resumeText, 'resume');
  addChunks(jdText, 'job_description');
  if (companyProfile) addChunks(companyProfile, 'company_profile');

  // Index in local store to guarantee retrieval fallback
  await memoryStore.addDocuments(sessionId, chunks);

  // Attempt to index in ChromaDB cloud / local server if configured
  try {
    console.log(`ChromaDB: Connecting to ${baseUrl} (Tenant: ${process.env.CHROMA_TENANT || 'default'})`);
    
    // Heartbeat check
    const heartbeatRes = await fetch(`${baseUrl}/api/v1/heartbeat${queryParams}`, { 
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000) 
    });

    if (heartbeatRes.ok) {
      console.log('ChromaDB: Connection verified. Creating collection...');
      
      // Clean collection name (alphanumeric, dashes, underscores, length 3-63)
      const collectionName = `session-${sessionId}`.substring(0, 60);

      const collectionRes = await fetch(`${baseUrl}/api/v1/collections${queryParams}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          name: collectionName, 
          metadata: { description: 'Interview prep context' } 
        })
      });
      
      if (collectionRes.ok) {
        const coll = await collectionRes.json();
        const collectionId = coll.id;

        if (collectionId && chunks.length > 0) {
          console.log(`ChromaDB: Collection created (${collectionId}). Adding ${chunks.length} documents...`);
          
          const addRes = await fetch(`${baseUrl}/api/v1/collections/${collectionId}/add${queryParams}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              documents: chunks.map(c => c.text),
              metadatas: chunks.map(c => c.metadata),
              ids: chunks.map((c, idx) => `${sessionId}_chunk_${idx}`)
            })
          });

          if (addRes.ok) {
            console.log('ChromaDB: Successfully indexed documents in cloud vector store.');
          } else {
            const addErr = await addRes.text();
            console.warn('ChromaDB: Failed to add documents to collection:', addErr);
          }
        }
      } else {
        const collErr = await collectionRes.text();
        console.warn('ChromaDB: Collection creation failed:', collErr);
      }
    }
  } catch (err) {
    console.log('ChromaDB: Cloud sync skipped or failed, using local memoryStore fallback.', err.message);
  }

  return { success: true, count: chunks.length };
};

export const retrieveContext = async (sessionId, query, k = 3) => {
  const { baseUrl, headers, queryParams } = getChromaConfig();
  
  // Try querying ChromaDB
  try {
    const collectionName = `session-${sessionId}`.substring(0, 60);
    
    // Get collection ID
    const collectionRes = await fetch(`${baseUrl}/api/v1/collections/${collectionName}${queryParams}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000)
    });

    if (collectionRes.ok) {
      const coll = await collectionRes.json();
      const collectionId = coll.id;

      if (collectionId) {
        const queryRes = await fetch(`${baseUrl}/api/v1/collections/${collectionId}/query${queryParams}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query_texts: [query],
            n_results: k
          })
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          const docs = queryData.documents?.[0] || [];
          if (docs.length > 0) {
            console.log(`ChromaDB: Retrieved ${docs.length} relevant docs from cloud.`);
            return docs.join('\n\n');
          }
        }
      }
    }
  } catch (err) {
    console.log('ChromaDB: Cloud query failed, falling back to local memory store.', err.message);
  }

  // Fallback to local memory retrieval
  const docs = await memoryStore.similaritySearch(sessionId, query, k);
  if (docs.length > 0) {
    return docs.map(d => d.text).join('\n\n');
  }
  return '';
};

// Advanced RAG Retrieval: Hybrid Search (Lexical + Vector) followed by LLM Reranking
export const retrieveAdvancedContext = async (sessionId, query, k = 3) => {
  const { baseUrl, headers, queryParams } = getChromaConfig();
  let candidateChunks = [];

  // Step 1: Lexical Search (token matching) on local memoryStore
  const lexicalDocs = await memoryStore.similaritySearch(sessionId, query, 10);
  lexicalDocs.forEach(d => {
    candidateChunks.push({ text: d.text, source: 'lexical', metadata: d.metadata });
  });

  // Step 2: Dense Vector Similarity Search
  try {
    const collectionName = `session-${sessionId}`.substring(0, 60);
    const collectionRes = await fetch(`${baseUrl}/api/v1/collections/${collectionName}${queryParams}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000)
    });

    if (collectionRes.ok) {
      const coll = await collectionRes.json();
      const collectionId = coll.id;

      if (collectionId) {
        const queryRes = await fetch(`${baseUrl}/api/v1/collections/${collectionId}/query${queryParams}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query_texts: [query],
            n_results: 10
          })
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          const docs = queryData.documents?.[0] || [];
          const metadatas = queryData.metadatas?.[0] || [];
          docs.forEach((doc, idx) => {
            candidateChunks.push({ text: doc, source: 'vector', metadata: metadatas[idx] });
          });
        }
      }
    }
  } catch (err) {
    console.log('ChromaDB: Vector retrieval for Rerank failed, using local memory only.', err.message);
  }

  // Deduplicate chunks by text content
  const uniqueMap = new Map();
  candidateChunks.forEach(chunk => {
    uniqueMap.set(chunk.text, chunk);
  });
  const dedupedChunks = Array.from(uniqueMap.values());

  if (dedupedChunks.length === 0) return { context: '', sources: [] };

  // Step 3: LLM Reranking
  const apiKey = process.env.GROQ_API_KEY;
  const isDemo = process.env.DEMO_MODE === 'true' || !apiKey || apiKey.includes('your_groq_api_key');

  if (isDemo || dedupedChunks.length <= k) {
    const topChunks = dedupedChunks.slice(0, k);
    return {
      context: topChunks.map(c => c.text).join('\n\n'),
      sources: topChunks.map(c => c.metadata?.chunkId || 'general_kb')
    };
  }

  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.1-8b-instant',
      modelName: 'llama-3.1-8b-instant',
      temperature: 0.0
    });

    const rerankPrompt = `You are a Search Reranking Assistant. Evaluate the relevance of each Candidate Context paragraph to the User Query.
Score each paragraph from 0 to 10 based on how directly it answers or provides necessary context for the query.

Return ONLY a valid JSON array of objects, containing the index and the score.
Schema format:
[
  { "index": 0, "score": 9.5 },
  { "index": 1, "score": 3.0 }
]

Do not include markdown codeblocks or explanations.

User Query:
${query}

Candidate Contexts:
${dedupedChunks.map((c, idx) => `[Paragraph ${idx}]:\n${c.text}`).join('\n\n')}`;

    const response = await model.invoke(rerankPrompt);
    let content = response.content.trim();

    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const scores = JSON.parse(content);
    
    const scoredChunks = scores.map(item => {
      return {
        chunk: dedupedChunks[item.index],
        score: item.score
      };
    }).sort((a, b) => b.score - a.score);

    const topScored = scoredChunks.slice(0, k).map(item => item.chunk);

    console.log(`AdvancedRAG Reranker: Scored ${scoredChunks.length} chunks. Selected top ${k} relevant.`);
    
    return {
      context: topScored.map(c => c.text).join('\n\n'),
      sources: topScored.map(c => c.metadata?.chunkId || 'general_kb')
    };
  } catch (err) {
    console.warn('AdvancedRAG: Reranker failed, returning top lexical/vector fallback.', err.message);
    const topFallback = dedupedChunks.slice(0, k);
    return {
      context: topFallback.map(c => c.text).join('\n\n'),
      sources: topFallback.map(c => c.metadata?.chunkId || 'general_kb')
    };
  }
};

