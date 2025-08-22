/**
 * Shared hash generation utilities for quizit tests
 * Ensures consistency between saving and retrieving tests
 */

/**
 * Generate a hash for quizit test content
 * Uses djb2 algorithm for consistency across frontend and backend
 * @param {string} components - The quizit component structure JSON
 * @param {string} wordsToAvoid - Words/phrases to avoid
 * @returns {string} 8-character hex hash
 */
export const generateQuizitHash = (components = '', wordsToAvoid = '', cardIdea = '') => {
  const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}\n\nCard Idea:\n${cardIdea}`;
  
  // djb2 hash algorithm for consistency
  let hash = 5381;
  for (let i = 0; i < combinedContent.length; i += 1) {
    hash = ((hash << 5) + hash) + combinedContent.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  
  // Convert to hex string (same format as backend)
  return (hash >>> 0).toString(16).padStart(8, '0');
};
