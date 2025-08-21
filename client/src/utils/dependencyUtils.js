/**
 * Utility functions for handling component dependencies and generating valid orderings
 */

/**
 * Builds a dependency graph from components
 * @param {Array} components - Array of component objects with id and prerequisites
 * @returns {Object} - Adjacency list representation of the graph
 */
export const buildDependencyGraph = (components) => {
  const graph = {};
  const incomingEdges = {};
  
  // Initialize graph and incoming edge counts
  components.forEach(component => {
    graph[component.id] = [];
    incomingEdges[component.id] = 0;
  });
  
  // Build edges and count incoming edges
  components.forEach(component => {
    if (component.prerequisites && component.prerequisites.length > 0) {
      component.prerequisites.forEach(prereqId => {
        if (graph[prereqId]) {
          graph[prereqId].push(component.id);
          incomingEdges[component.id]++;
        }
      });
    }
  });
  
  return { graph, incomingEdges };
};

/**
 * Detects cycles in the dependency graph using DFS
 * @param {Object} graph - Adjacency list representation
 * @returns {boolean} - True if cycle detected, false otherwise
 */
export const detectCycles = (graph) => {
  const visited = new Set();
  const recStack = new Set();
  
  const hasCycle = (node) => {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;
    
    visited.add(node);
    recStack.add(node);
    
    for (const neighbor of graph[node] || []) {
      if (hasCycle(neighbor)) return true;
    }
    
    recStack.delete(node);
    return false;
  };
  
  for (const node of Object.keys(graph)) {
    if (hasCycle(node)) return true;
  }
  
  return false;
};

/**
 * Generates valid orderings using topological sort
 * @param {Array} components - Array of component objects
 * @param {number} maxPermutations - Maximum number of permutations to return
 * @returns {Object} - { validOrderings: Array, error: string|null }
 */
export const generateValidOrderings = (components, maxPermutations = 3) => {
  try {
    // Validate components
    if (!components || components.length === 0) {
      return { validOrderings: [], error: null };
    }
    
    // Check for invalid component references
    const componentIds = new Set(components.map(c => c.id));
    for (const component of components) {
      if (component.prerequisites) {
        for (const prereqId of component.prerequisites) {
          if (!componentIds.has(prereqId)) {
            return { 
              validOrderings: [], 
              error: `Component ${component.id} references non-existent component ${prereqId}` 
            };
          }
        }
      }
    }
    
    const { graph, incomingEdges } = buildDependencyGraph(components);
    
    // Check for cycles
    if (detectCycles(graph)) {
      return { validOrderings: [], error: "Circular dependency detected" };
    }
    
    // Generate all valid orderings using topological sort
    const allOrderings = [];
    const generateOrderings = (currentOrdering, remainingNodes, remainingIncoming) => {
      if (remainingNodes.length === 0) {
        allOrderings.push(currentOrdering.join(' '));
        return;
      }
      
      // Find nodes with no incoming edges
      const availableNodes = remainingNodes.filter(node => remainingIncoming[node] === 0);
      
      for (const node of availableNodes) {
        const newOrdering = [...currentOrdering, node];
        const newRemainingNodes = remainingNodes.filter(n => n !== node);
        const newRemainingIncoming = { ...remainingIncoming };
        
        // Remove outgoing edges from this node
        for (const neighbor of graph[node] || []) {
          newRemainingIncoming[neighbor]--;
        }
        
        generateOrderings(newOrdering, newRemainingNodes, newRemainingIncoming);
      }
    };
    
    generateOrderings([], Object.keys(graph), { ...incomingEdges });
    
    // Select most diverse permutations
    const validOrderings = selectMostDiverseOrderings(allOrderings, maxPermutations);
    
    return { validOrderings, error: null };
    
  } catch (error) {
    return { validOrderings: [], error: `Error generating orderings: ${error.message}` };
  }
};

/**
 * Selects the most diverse permutations from a list of valid orderings
 * @param {Array} allOrderings - Array of all valid orderings
 * @param {number} maxPermutations - Maximum number of permutations to return
 * @returns {Array} - Most diverse subset of orderings
 */
const selectMostDiverseOrderings = (allOrderings, maxPermutations) => {
  if (allOrderings.length <= maxPermutations) {
    return allOrderings;
  }
  
  // Convert orderings to arrays for easier manipulation
  const orderingsArray = allOrderings.map(ordering => ordering.split(' '));
  
  // First priority: ensure different components appear first
  const firstComponentGroups = {};
  orderingsArray.forEach((ordering, index) => {
    const firstComponent = ordering[0];
    if (!firstComponentGroups[firstComponent]) {
      firstComponentGroups[firstComponent] = [];
    }
    firstComponentGroups[firstComponent].push(index);
  });
  
  // Select at least one permutation from each first component group
  const selectedIndices = new Set();
  Object.values(firstComponentGroups).forEach(group => {
    if (group.length > 0) {
      selectedIndices.add(group[0]); // Add first permutation from each group
    }
  });
  
  // Second priority: maximize overall position variation
  const remainingSlots = maxPermutations - selectedIndices.size;
  if (remainingSlots > 0) {
    // Calculate diversity score for remaining permutations
    const remainingOrderings = orderingsArray.filter((_, index) => !selectedIndices.has(index));
    const diversityScores = remainingOrderings.map((ordering, index) => {
      let score = 0;
      
      // Score based on how different this ordering is from already selected ones
      selectedIndices.forEach(selectedIndex => {
        const selectedOrdering = orderingsArray[selectedIndex];
        let positionDiff = 0;
        
        // Calculate position differences for each component
        ordering.forEach((component, pos) => {
          const selectedPos = selectedOrdering.indexOf(component);
          positionDiff += Math.abs(pos - selectedPos);
        });
        
        score += positionDiff;
      });
      
      return { index: remainingOrderings.indexOf(ordering), score };
    });
    
    // Sort by diversity score (higher = more different from selected ones)
    diversityScores.sort((a, b) => b.score - a.score);
    
    // Add the most diverse remaining permutations
    for (let i = 0; i < Math.min(remainingSlots, diversityScores.length); i++) {
      const originalIndex = allOrderings.indexOf(remainingOrderings[diversityScores[i].index].join(' '));
      selectedIndices.add(originalIndex);
    }
  }
  
  // Convert back to original format and return
  return Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map(index => allOrderings[index]);
};

// Test the functions with sample data
if (typeof window !== 'undefined') {
  // Only run tests in browser environment
  const testComponents = [
    { id: 'A', text: 'Component A', prerequisites: [] },
    { id: 'B', text: 'Component B', prerequisites: ['A'] },
    { id: 'C', text: 'Component C', prerequisites: ['A'] },
    { id: 'D', text: 'Component D', prerequisites: ['B', 'C'] }
  ];
  
  console.log('🧪 Testing dependency utilities...');
  
  // Test 1: Build dependency graph
  const { graph, incomingEdges } = buildDependencyGraph(testComponents);
  console.log('✅ Graph built:', graph);
  console.log('✅ Incoming edges:', incomingEdges);
  
  // Test 2: Detect cycles (should be false)
  const hasCycles = detectCycles(graph);
  console.log('✅ Cycle detection:', hasCycles);
  
  // Test 3: Generate valid orderings
  const { validOrderings, error } = generateValidOrderings(testComponents);
  console.log('✅ Valid orderings:', validOrderings);
  console.log('✅ Error:', error);
  
  // Test 4: Test with circular dependency
  const circularComponents = [
    { id: 'A', text: 'Component A', prerequisites: ['B'] },
    { id: 'B', text: 'Component B', prerequisites: ['A'] }
  ];
  
  const circularResult = generateValidOrderings(circularComponents);
  console.log('✅ Circular dependency test:', circularResult);
}
