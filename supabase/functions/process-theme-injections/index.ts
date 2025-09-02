import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { QdrantClient } from "https://esm.sh/@qdrant/js-client-rest@1.7.0"
import { OpenAI } from "https://esm.sh/openai@4.20.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Qdrant client configuration
const qdrantClient = new QdrantClient({
  url: Deno.env.get('QDRANT_URL') || 'https://6ea6ca52-e114-414a-864e-5272b9f40962.us-east-1-1.aws.cloud.qdrant.io',
  apiKey: Deno.env.get('QDRANT_API_KEY'),
})

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const COLLECTION_NAME = 'theme_injections'

// New hierarchical structure interfaces
interface ThemeNode {
  id: string | number
  text: string
  tags?: string[]
  children?: ThemeNode[]
}

interface ThemeInjectionsData {
  theme_injections: ThemeNode[]
}

interface ProcessedNode {
  id: string
  text: string
  tags: string[]
  parent_id?: string
  children: string[]
  level: number
}

interface Replacement {
  pasted_text: string
  existing_text: string
  existing_id: string
  similarity: number
}

interface DiverseDescendant {
  id: string
  text: string
  tags: string[]
  specificity: number
  similarity_to_root: number
}

interface EnhancedResult {
  root_node_id: string
  replacements: Replacement[]
  most_different_descendants: DiverseDescendant[]
  theme_injections: ThemeNode[]
}

// Normalize text: trim, collapse whitespace, Unicode NFC
function normalizeText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple whitespace to single space
    .normalize('NFC'); // Unicode normalization
}

// Validate hierarchical tree structure
function validateTree(data: ThemeInjectionsData): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!data.theme_injections || !Array.isArray(data.theme_injections)) {
    errors.push('Missing or invalid theme_injections array');
    return { isValid: false, errors, warnings };
  }
  
  // Check for empty arrays
  if (data.theme_injections.length === 0) {
    warnings.push('No theme injections provided');
  }
  
  // Validate theme injections structure
  const allIds = new Set<string | number>();
  
  function validateNode(node: ThemeNode, level: number, parentId?: string | number): void {
    // Check ID
    if (!node.id) {
      errors.push(`Theme injection at level ${level} missing id`);
      return;
    }
    
    if (allIds.has(node.id)) {
      errors.push(`Duplicate theme injection id: ${node.id}`);
      return;
    }
    allIds.add(node.id);
    
    // Check text
    if (!node.text || typeof node.text !== 'string') {
      errors.push(`Theme injection ${node.id} missing or invalid text`);
      return;
    }
    
    // Check tags
    if (node.tags && !Array.isArray(node.tags)) {
      errors.push(`Theme injection ${node.id} has invalid tags format`);
      return;
    }
    
    // Validate children recursively
    if (node.children && Array.isArray(node.children)) {
      if (level > 1) {
        errors.push(`Theme injection ${node.id} has children at level ${level} (max depth is 2)`);
        return;
      }
      
      node.children.forEach(child => validateNode(child, level + 1, node.id));
    }
  }
  
  // Validate all root nodes
  data.theme_injections.forEach(node => validateNode(node, 0));
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Convert hierarchical structure to flat array for processing
function flattenHierarchy(data: ThemeInjectionsData): ProcessedNode[] {
  const nodes: ProcessedNode[] = [];
  
  data.theme_injections.forEach(rootNode => {
    // Add root node
    nodes.push({
      id: String(rootNode.id),
      text: normalizeText(rootNode.text),
      tags: rootNode.tags || [],
      children: [],
      level: 0
    });
    
    // Add children if they exist
    if (rootNode.children && Array.isArray(rootNode.children)) {
      rootNode.children.forEach(childNode => {
        nodes.push({
          id: String(childNode.id),
          text: normalizeText(childNode.text),
          tags: childNode.tags || [],
          parent_id: String(rootNode.id),
          children: [],
          level: 1
        });
        
        // Add child to parent's children array
        const parent = nodes.find(n => n.id === String(rootNode.id));
        if (parent) {
          parent.children.push(String(childNode.id));
        }
      });
    }
  });
  
  return nodes;
}

// Initialize Qdrant collection if it doesn't exist
async function ensureCollectionExists(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(col => col.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // OpenAI ada-002 embedding size
          distance: 'Cosine'
        }
      });
      console.log(`Created collection: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error('Error ensuring collection exists:', error);
    throw error;
  }
}

// Generate a UUID for Qdrant point ID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate real embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`🔄 Generating embedding for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    console.log(`✅ Generated embedding: ${embedding.length} dimensions, first 3 values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}]`);
    
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

// Store new theme injection in vector database
async function storeThemeInjection(id: string, text: string, tags: string[]): Promise<void> {
  try {
    console.log(`💾 Storing new theme injection: ${id}`);
    console.log(`📝 Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`🏷️  Tags: [${tags.join(', ')}]`);
    
    const embedding = await generateEmbedding(text);
    
    // Generate a proper UUID for Qdrant
    const qdrantId = generateUUID();
    console.log(`🆔 Generated Qdrant UUID: ${qdrantId}`);
    
    console.log(`📤 Upserting to Qdrant collection: ${COLLECTION_NAME}`);
    await qdrantClient.upsert(COLLECTION_NAME, {
      points: [{
        id: qdrantId,
        vector: embedding,
        payload: {
          original_id: id, // Store the original ID in payload
          text: text,
          tags: tags,
          timestamp: new Date().toISOString()
        }
      }]
    });
    
    console.log(`✅ Successfully stored theme injection: ${id} with Qdrant ID: ${qdrantId}`);
  } catch (error) {
    console.error('❌ Error storing theme injection:', error);
    throw error;
  }
}

// Real similarity search using Qdrant and OpenAI embeddings
async function similaritySearch(text: string, tags: string[]): Promise<{
  found: boolean,
  existing_id?: string,
  existing_text?: string,
  similarity?: number
}> {
  try {
    console.log(`🔍 Searching for similar theme injection: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`🏷️  Tags: [${tags.join(', ')}]`);
    
    // Generate real embedding for the input text
    const embedding = await generateEmbedding(text);
    
    // Search for similar vectors in Qdrant
    console.log(`🔎 Searching Qdrant collection: ${COLLECTION_NAME}`);
    const searchResponse = await qdrantClient.search(COLLECTION_NAME, {
      vector: embedding,
      limit: 1,
      score_threshold: 0.8
    });
    
    console.log(`📊 Search response: ${searchResponse.length} results`);
    
    if (searchResponse.length > 0 && searchResponse[0].score > 0.8) {
      const result = searchResponse[0];
      const existingId = result.payload?.original_id as string || result.id as string;
      const existingText = result.payload?.text as string;
      const similarity = result.score;
      
      console.log(`✅ Found similar theme injection:`);
      console.log(`   - Qdrant ID: ${result.id}`);
      console.log(`   - Original ID: ${existingId}`);
      console.log(`   - Text: "${existingText?.substring(0, 50)}${existingText && existingText.length > 50 ? '...' : ''}"`);
      console.log(`   - Similarity Score: ${similarity.toFixed(4)}`);
      
      return {
        found: true,
        existing_id: existingId,
        existing_text: existingText,
        similarity: similarity
      };
    }
    
    console.log(`❌ No similar theme injection found (threshold: 0.8)`);
    return { found: false };
  } catch (error) {
    console.error('❌ Error in similarity search:', error);
    console.log(`❌ No fallback available - similarity search failed`);
    return { found: false };
  }
}

// Real diversity selection using embeddings
async function findMostDifferentDescendants(
  rootNodeId: string, 
  allNodes: ProcessedNode[]
): Promise<DiverseDescendant[]> {
  console.log(`🎯 Finding most different descendants using real embeddings...`);
  
  try {
    // Get the root node
    const rootNode = allNodes.find(node => node.id === rootNodeId);
    if (!rootNode) {
      console.log('❌ Root node not found');
      return [];
    }
    
    // Get descendant nodes (level 1)
    const descendants = allNodes.filter(node => node.level === 1);
    console.log(`📋 Found ${descendants.length} descendant nodes`);
    
    if (descendants.length === 0) {
      return [];
    }
    
    // Generate embeddings for root and all descendants
    console.log('🔄 Generating embeddings for diversity calculation...');
    const rootEmbedding = await generateEmbedding(rootNode.text);
    
    const descendantEmbeddings = await Promise.all(
      descendants.map(async (node) => ({
        node,
        embedding: await generateEmbedding(node.text)
      }))
    );
    
    // Calculate cosine similarity between root and each descendant
    const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
      const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
      const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitude1 * magnitude2);
    };
    
    // Calculate specificity based on text content
    const calculateSpecificity = (text: string): number => {
      let specificity = 0;
      if (/\d+/.test(text)) specificity += 1; // Has numbers
      if (/["']/.test(text)) specificity += 1; // Has quotes
      if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(text)) specificity += 1; // Has proper nouns
      return Math.min(specificity, 3); // Clamp to 0-3
    };
    
    // Calculate diversity scores (lower similarity = higher diversity)
    const diversityScores = descendantEmbeddings.map(({ node, embedding }) => {
      const similarityToRoot = calculateCosineSimilarity(rootEmbedding, embedding);
      const diversity = 1 - similarityToRoot; // Inverse of similarity
      const specificity = calculateSpecificity(node.text);
      
      return {
        node,
        diversity,
        similarityToRoot,
        specificity
      };
    });
    
    // Sort by diversity (highest first) and take top 6
    const mostDiverse = diversityScores
      .sort((a, b) => b.diversity - a.diversity)
      .slice(0, 6);
    
    console.log(`✅ Found ${mostDiverse.length} most diverse descendants`);
    mostDiverse.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.node.id}: diversity=${item.diversity.toFixed(4)}, similarity=${item.similarityToRoot.toFixed(4)}`);
    });
    
    // Convert to DiverseDescendant format
    return mostDiverse.map(item => ({
      id: item.node.id,
      text: item.node.text,
      tags: item.node.tags,
      specificity: item.specificity,
      similarity_to_root: item.similarityToRoot
    }));
    
  } catch (error) {
    console.error('❌ Error in real diversity selection:', error);
    return [];
  }
}

async function vectorDBOperations(nodes: ProcessedNode[]): Promise<{
  inserted_count: number,
  linked_count: number,
  replacements: Replacement[]
}> {
  console.log(`🚀 Starting vector database operations for ${nodes.length} nodes`);
  
  const replacements: Replacement[] = [];
  let linkedCount = 0;
  
  // Ensure collection exists before operations
  console.log(`🔧 Ensuring Qdrant collection exists: ${COLLECTION_NAME}`);
  await ensureCollectionExists();
  console.log(`✅ Collection ready: ${COLLECTION_NAME}`);
  
  // Check each node for similarity and store new ones
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    console.log(`\n📋 Processing node ${i + 1}/${nodes.length}: ${node.id}`);
    
    const similarityResult = await similaritySearch(node.text, node.tags);
    if (similarityResult.found) {
      // Found similar existing theme injection
      console.log(`🔗 Linking to existing theme injection: ${similarityResult.existing_id}`);
      replacements.push({
        pasted_text: node.text,
        existing_text: similarityResult.existing_text!,
        existing_id: similarityResult.existing_id!,
        similarity: similarityResult.similarity!
      });
      linkedCount++;
    } else {
      // Store new theme injection in vector database
      console.log(`🆕 No similar theme injection found, storing as new`);
      try {
        await storeThemeInjection(node.id, node.text, node.tags);
      } catch (error) {
        console.error(`❌ Failed to store theme injection ${node.id}:`, error);
      }
    }
  }
  
  console.log(`\n📊 Vector DB operations completed:`);
  console.log(`   - Total nodes: ${nodes.length}`);
  console.log(`   - Linked to existing: ${linkedCount}`);
  console.log(`   - Newly stored: ${nodes.length - linkedCount}`);
  console.log(`   - Replacements: ${replacements.length}`);
  
  return {
    inserted_count: nodes.length - linkedCount,
    linked_count: linkedCount,
    replacements
  };
}

// Build enhanced response structure
function buildEnhancedResponse(
  nodes: ProcessedNode[], 
  replacements: Replacement[], 
  mostDifferentDescendants: DiverseDescendant[]
): EnhancedResult {
  // Find the root node (first general scenario)
  const rootNode = nodes.find(node => node.level === 0);
  const rootNodeId = rootNode ? rootNode.id : 'unknown';
  
  // Convert flat nodes back to hierarchical structure
  const themeInjections: ThemeNode[] = [];
  
  // Group nodes by level
  const rootNodes = nodes.filter(node => node.level === 0);
  
  rootNodes.forEach(rootNode => {
    const children = nodes
      .filter(node => node.level === 1 && node.parent_id === rootNode.id)
      .map(childNode => ({
        id: childNode.id,
        text: childNode.text,
        tags: childNode.tags
      }));
    
    themeInjections.push({
      id: rootNode.id,
      text: rootNode.text,
      tags: rootNode.tags,
      children: children.length > 0 ? children : undefined
    });
  });
  
  return {
    root_node_id: rootNodeId,
    replacements,
    most_different_descendants: mostDifferentDescendants,
    theme_injections: themeInjections
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log(`\n🌐 New request received: ${req.method} ${req.url}`);
    
    const { themeInjectionsData } = await req.json();
    
    if (!themeInjectionsData) {
      console.log('❌ Missing themeInjectionsData parameter');
      return new Response(
        JSON.stringify({ error: 'Missing themeInjectionsData' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('📥 Received theme injections data');
    console.log('📊 Data type:', typeof themeInjectionsData);
    console.log('📊 Data length:', themeInjectionsData.length || 'N/A');
    
    // Parse the data
    let parsedData: ThemeInjectionsData;
    try {
      console.log('🔍 Parsing theme injections data...');
      parsedData = typeof themeInjectionsData === 'string' 
        ? JSON.parse(themeInjectionsData) 
        : themeInjectionsData;
      console.log('✅ Data parsed successfully');
    } catch (error) {
      console.log('❌ JSON parsing failed:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validate the tree structure
    console.log('🔍 Validating tree structure...');
    const validation = validateTree(parsedData);
    
    if (!validation.isValid) {
      console.log('❌ Tree validation failed:', validation);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          validation 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✅ Tree validation passed');
    
    // Convert hierarchical structure to flat array for processing
    console.log('🔄 Converting hierarchical structure to flat array...');
    const nodes = flattenHierarchy(parsedData);
    console.log(`📋 Converted to ${nodes.length} flat nodes`);
    
    // Enhanced processing with real vectorDB operations
    console.log('🚀 Starting vector database operations...');
    const vectorDBResult = await vectorDBOperations(nodes);
    
    // Get newly inserted nodes (not linked to existing ones)
    const newlyInsertedNodes = nodes.filter(node => {
      const wasLinked = vectorDBResult.replacements.some(replacement => 
        replacement.pasted_text === node.text
      );
      return !wasLinked; // Keep only nodes that were NOT linked
    });
    
    // Get replacement nodes (existing ones that matched pasted ones)
    const replacementNodes = nodes.filter(node => {
      const wasLinked = vectorDBResult.replacements.some(replacement => 
        replacement.pasted_text === node.text
      );
      return wasLinked; // Keep nodes that WERE linked
    });
    
    // Combine all processed nodes for diversity selection and UI display
    const allProcessedNodes = [...newlyInsertedNodes, ...replacementNodes];
    
    console.log(`📊 Node filtering results:`);
    console.log(`   - Total nodes processed: ${nodes.length}`);
    console.log(`   - Nodes linked to existing: ${vectorDBResult.linked_count}`);
    console.log(`   - Nodes newly inserted: ${newlyInsertedNodes.length}`);
    console.log(`   - Replacement nodes: ${replacementNodes.length}`);
    console.log(`   - Combined processed nodes: ${allProcessedNodes.length}`);
    

    
    // Find most different descendants from ALL PROCESSED nodes
    console.log('🎯 Finding most different descendants from ALL PROCESSED nodes...');
    const rootNode = allProcessedNodes.find(node => node.level === 0) || nodes.find(node => node.level === 0);
    const rootNodeId = rootNode ? rootNode.id : 'unknown';
    console.log(`🌳 Root node ID: ${rootNodeId}`);
    
    const mostDifferentDescendants = await findMostDifferentDescendants(rootNodeId, allProcessedNodes);
    console.log(`✅ Found ${mostDifferentDescendants.length} most different descendants from all processed nodes`);
    
    // Build enhanced response using ALL PROCESSED nodes
    console.log('🔧 Building enhanced response with ALL PROCESSED nodes...');
    const enhancedResult = buildEnhancedResponse(allProcessedNodes, vectorDBResult.replacements, mostDifferentDescendants);
    

    
    console.log('📤 Final result summary:');
    console.log(`   - Root node ID: ${enhancedResult.root_node_id}`);
    console.log(`   - Replacements: ${enhancedResult.replacements.length}`);
    console.log(`   - Most different descendants: ${enhancedResult.most_different_descendants.length}`);
    console.log(`   - Theme injections (processed): ${enhancedResult.theme_injections.length}`);
    console.log(`   - Original pasted nodes: ${nodes.length}`);
    console.log(`   - Processed nodes (new + replacement): ${allProcessedNodes.length}`);
    
    // Return the result directly (no need for UI-compatible transformation)
    return new Response(
      JSON.stringify(enhancedResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing theme injections:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
