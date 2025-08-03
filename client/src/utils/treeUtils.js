/**
 * Utility functions for working with hierarchical/tree data structures
 */

/**
 * Builds a hierarchical tree structure from flat array of items with parent_id
 * @param {Array} flatItems - Array of items with id and parent_id properties
 * @param {string} idKey - Key name for the id field (default: 'id')
 * @param {string} parentKey - Key name for the parent field (default: 'parent_id')
 * @param {string} childrenKey - Key name for children array (default: 'children')
 * @returns {Array} Tree structure with nested children
 */
export const buildTreeFromFlat = (flatItems, idKey = 'id', parentKey = 'parent_id', childrenKey = 'children') => {
  const itemMap = new Map();
  const rootItems = [];

  // Create map of all items
  flatItems.forEach(item => {
    itemMap.set(item[idKey], { ...item, [childrenKey]: [] });
  });

  // Build tree structure
  flatItems.forEach(item => {
    if (item[parentKey] === null || item[parentKey] === undefined) {
      rootItems.push(itemMap.get(item[idKey]));
    } else {
      const parent = itemMap.get(item[parentKey]);
      if (parent) {
        parent[childrenKey].push(itemMap.get(item[idKey]));
      }
    }
  });

  return rootItems;
};

/**
 * Specific function for building section trees
 * @param {Array} flatSections - Array of sections from database
 * @returns {Array} Hierarchical section structure
 */
export const buildSectionTree = (flatSections) => {
  return buildTreeFromFlat(flatSections, 'id', 'parent_id', 'children');
};

/**
 * Calculates completion statistics for a section and its children
 * @param {Object} section - Section object with children array
 * @returns {Object} Completion stats: { totalChildren, completedChildren, percentage, isCompleted }
 */
export const calculateSectionCompletion = (section) => {
  if (!section.children || section.children.length === 0) {
    return {
      totalChildren: 0,
      completedChildren: 0,
      percentage: section.done ? 100 : 0,
      isCompleted: section.done || false
    };
  }

  let totalChildren = 0;
  let completedChildren = 0;

  const traverse = (nodes) => {
    nodes.forEach(node => {
      totalChildren++;
      if (node.done) {
        completedChildren++;
      }
      
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(section.children);

  const percentage = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0;
  const isCompleted = section.done || (totalChildren > 0 && completedChildren === totalChildren);

  return {
    totalChildren,
    completedChildren,
    percentage,
    isCompleted
  };
};

/**
 * Adds completion data to all sections in a tree
 * @param {Array} tree - Tree structure of sections
 * @returns {Array} Tree with completion data added to each section
 */
export const addCompletionDataToTree = (tree) => {
  const processNode = (node) => {
    const completion = calculateSectionCompletion(node);
    const processedNode = {
      ...node,
      completion
    };

    if (node.children && node.children.length > 0) {
      processedNode.children = node.children.map(processNode);
    }

    return processedNode;
  };

  return tree.map(processNode);
};

/**
 * Flattens a tree structure back to a flat array
 * @param {Array} tree - Tree structure
 * @param {string} childrenKey - Key name for children array (default: 'children')
 * @returns {Array} Flattened array
 */
export const flattenTree = (tree, childrenKey = 'children') => {
  const result = [];
  
  const traverse = (nodes, parentId = null) => {
    nodes.forEach(node => {
      const { [childrenKey]: children, ...nodeWithoutChildren } = node;
      result.push({ ...nodeWithoutChildren, parent_id: parentId });
      
      if (children && children.length > 0) {
        traverse(children, node.id);
      }
    });
  };
  
  traverse(tree);
  return result;
};

/**
 * Finds a node in a tree by ID
 * @param {Array} tree - Tree structure
 * @param {string|number} id - ID to search for
 * @param {string} childrenKey - Key name for children array (default: 'children')
 * @returns {Object|null} Found node or null
 */
export const findNodeById = (tree, id, childrenKey = 'children') => {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    
    if (node[childrenKey] && node[childrenKey].length > 0) {
      const found = findNodeById(node[childrenKey], id, childrenKey);
      if (found) return found;
    }
  }
  
  return null;
};

/**
 * Gets the path from root to a specific node
 * @param {Array} tree - Tree structure
 * @param {string|number} targetId - ID of target node
 * @param {string} childrenKey - Key name for children array (default: 'children')
 * @returns {Array} Array of nodes from root to target
 */
export const getNodePath = (tree, targetId, childrenKey = 'children') => {
  const path = [];
  
  const traverse = (nodes, targetId) => {
    for (const node of nodes) {
      path.push(node);
      
      if (node.id === targetId) {
        return true;
      }
      
      if (node[childrenKey] && node[childrenKey].length > 0) {
        if (traverse(node[childrenKey], targetId)) {
          return true;
        }
      }
      
      path.pop();
    }
    
    return false;
  };
  
  traverse(tree, targetId);
  return path;
}; 