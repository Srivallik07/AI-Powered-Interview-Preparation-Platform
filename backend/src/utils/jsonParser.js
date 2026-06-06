/**
 * Safely extracts and parses a JSON object or array from a string.
 * It is extremely resilient to conversational prefix/suffix, markdown code blocks,
 * and trailing characters returned by LLMs.
 * 
 * @param {string} text The string containing the JSON to parse
 * @returns {any} The parsed JSON object or array
 */
export const safeParseJSON = (text) => {
  if (!text) {
    throw new Error('Empty text provided to JSON parser');
  }
  
  let cleaned = text.trim();
  
  // Try direct parsing first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Continue to extraction logic
  }

  // Look for JSON markdown block
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  const match = markdownRegex.exec(cleaned);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (err) {
      cleaned = match[1].trim(); // Fallback to parsing the matched block with extraction
    }
  }

  // Find the first occurrence of '{' or '[' and the last occurrence of '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  let endIdx = -1;
  let searchChar = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    searchChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    searchChar = ']';
  }
  
  if (startIdx !== -1) {
    endIdx = cleaned.lastIndexOf(searchChar);
    if (endIdx !== -1 && endIdx > startIdx) {
      const candidate = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(candidate);
      } catch (err) {
        // Continue and fail at the end
      }
    }
  }

  // If everything fails, throw the original parse error
  return JSON.parse(text);
};

export default safeParseJSON;
