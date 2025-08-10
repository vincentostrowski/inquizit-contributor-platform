import React, { useState } from 'react';
import Card from '../cards_page/Card';

const OrganizeRightPanel = ({ sections, onCardDrop }) => {
  // Mock data for development
  const mockCategories = [
    {
      id: 'cat-1',
      title: 'Key Concepts',
      showDescription: true,
      cards: [
        {
          id: 'card-1',
          title: 'Introduction to React',
          content: 'React is a JavaScript library for building user interfaces...',
          order: 1
        },
        {
          id: 'card-2',
          title: 'Component Lifecycle',
          content: 'Understanding how components mount, update, and unmount...',
          order: 2
        },
        {
          id: 'card-3',
          title: 'JSX Fundamentals',
          content: 'Learn the syntax and structure of JSX elements...',
          order: 3
        },
        {
          id: 'card-4',
          title: 'Props and State',
          content: 'Managing component data and communication...',
          order: 4
        },
        {
          id: 'card-5',
          title: 'Event Handling',
          content: 'Responding to user interactions and form submissions...',
          order: 5
        },
        {
          id: 'card-6',
          title: 'Conditional Rendering',
          content: 'Showing different content based on conditions...',
          order: 6
        },
        {
          id: 'card-7',
          title: 'Lists and Keys',
          content: 'Rendering dynamic lists with proper key management...',
          order: 7
        },
        {
          id: 'card-8',
          title: 'Component Composition',
          content: 'Building complex UIs from simple components...',
          order: 8
        }
      ]
    },
    {
      id: 'cat-2',
      title: 'Advanced Topics',
      showDescription: true,
      cards: [
        {
          id: 'card-9',
          title: 'Hooks Deep Dive',
          content: 'Exploring custom hooks and advanced hook patterns...',
          order: 1
        },
        {
          id: 'card-10',
          title: 'Context API Mastery',
          content: 'Global state management without external libraries...',
          order: 2
        },
        {
          id: 'card-11',
          title: 'Performance Optimization',
          content: 'Techniques to improve React app performance...',
          order: 3
        },
        {
          id: 'card-12',
          title: 'Memoization Strategies',
          content: 'Using React.memo, useMemo, and useCallback...',
          order: 4
        },
        {
          id: 'card-13',
          title: 'Code Splitting',
          content: 'Lazy loading components for better performance...',
          order: 5
        },
        {
          id: 'card-14',
          title: 'Error Boundaries',
          content: 'Graceful error handling in React applications...',
          order: 6
        },
        {
          id: 'card-15',
          title: 'Refs and DOM Access',
          content: 'Direct access to DOM elements when needed...',
          order: 7
        },
        {
          id: 'card-16',
          title: 'Portals and Modals',
          content: 'Rendering components outside the normal DOM hierarchy...',
          order: 8
        }
      ]
    },
    {
      id: 'cat-3',
      title: 'Best Practices',
      showDescription: true,
      cards: [
        {
          id: 'card-17',
          title: 'Component Naming',
          content: 'Conventions for clear and descriptive component names...',
          order: 1
        },
        {
          id: 'card-18',
          title: 'Prop Validation',
          content: 'Using PropTypes and TypeScript for type safety...',
          order: 2
        },
        {
          id: 'card-19',
          title: 'State Management',
          content: 'Organizing and structuring component state...',
          order: 3
        },
        {
          id: 'card-20',
          title: 'Testing Strategies',
          content: 'Unit testing React components and hooks...',
          order: 4
        },
        {
          id: 'card-21',
          title: 'Accessibility',
          content: 'Making React apps accessible to all users...',
          order: 5
        },
        {
          id: 'card-22',
          title: 'Performance Monitoring',
          content: 'Tools and techniques for measuring app performance...',
          order: 6
        },
        {
          id: 'card-23',
          title: 'Code Organization',
          content: 'Structuring React projects for maintainability...',
          order: 7
        },
        {
          id: 'card-24',
          title: 'Deployment Best Practices',
          content: 'Optimizing React apps for production deployment...',
          order: 8
        }
      ]
    },
    {
      id: 'cat-4',
      title: 'State Management',
      showDescription: true,
      cards: [
        {
          id: 'card-25',
          title: 'Redux Fundamentals',
          content: 'Understanding the Redux architecture and principles...',
          order: 1
        },
        {
          id: 'card-26',
          title: 'Redux Toolkit',
          content: 'Modern Redux development with RTK...',
          order: 2
        },
        {
          id: 'card-27',
          title: 'Zustand Basics',
          content: 'Lightweight state management alternative...',
          order: 3
        },
        {
          id: 'card-28',
          title: 'Jotai Atoms',
          content: 'Atomic state management with React...',
          order: 4
        },
        {
          id: 'card-29',
          title: 'Recoil Patterns',
          content: 'Facebook\'s experimental state management library...',
          order: 5
        },
        {
          id: 'card-30',
          title: 'State Persistence',
          content: 'Saving and restoring application state...',
          order: 6
        },
        {
          id: 'card-31',
          title: 'Async State Handling',
          content: 'Managing loading, success, and error states...',
          order: 7
        },
        {
          id: 'card-32',
          title: 'State Synchronization',
          content: 'Keeping multiple components in sync...',
          order: 8
        }
      ]
    },
    {
      id: 'cat-5',
      title: 'Testing & Quality',
      showDescription: true,
      cards: [
        {
          id: 'card-33',
          title: 'Jest Fundamentals',
          content: 'JavaScript testing framework for React...',
          order: 1
        },
        {
          id: 'card-34',
          title: 'React Testing Library',
          content: 'Testing React components from a user perspective...',
          order: 2
        },
        {
          id: 'card-35',
          title: 'Component Testing',
          content: 'Testing individual React components...',
          order: 3
        },
        {
          id: 'card-36',
          title: 'Hook Testing',
          content: 'Testing custom React hooks in isolation...',
          order: 4
        },
        {
          id: 'card-37',
          title: 'Integration Testing',
          content: 'Testing component interactions and workflows...',
          order: 5
        },
        {
          id: 'card-38',
          title: 'Mocking Strategies',
          content: 'Creating test doubles for external dependencies...',
          order: 6
        },
        {
          id: 'card-39',
          title: 'Test Coverage',
          content: 'Measuring and improving test coverage...',
          order: 7
        },
        {
          id: 'card-40',
          title: 'E2E Testing',
          content: 'End-to-end testing with Cypress or Playwright...',
          order: 8
        }
      ]
    }
  ];

  const [newCategories, setNewCategories] = useState(mockCategories);
  const [draggedCards, setDraggedCards] = useState([]);

  const handleCreateCategory = () => {
    const newCategory = {
      id: `new-${Date.now()}`,
      title: `New Category ${newCategories.length + 1}`,
      showDescription: true,
      cards: []
    };
    setNewCategories([...newCategories, newCategory]);
  };

  const handleDeleteCategory = (categoryId) => {
    setNewCategories(newCategories.filter(cat => cat.id !== categoryId));
  };

  const handleCardDrop = (categoryId, card) => {
    // Add the card to the specified category
    setNewCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, cards: [...cat.cards, card] }
        : cat
    ));
    
    // Notify parent component if callback provided
    if (onCardDrop) {
      onCardDrop(categoryId, card);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Functional Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 leading-none">Final Sections</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateCategory}
              className="px-3 py-1 rounded text-sm transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              Generate
            </button>
            <button className="px-3 py-1 rounded text-sm transition-colors bg-green-600 text-white hover:bg-green-700">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cards Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {newCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">No categories yet</p>
            <p className="text-sm">Create a category and drag cards from the left to start organizing</p>
          </div>
        ) : (
          <div className="space-y-8">
            {newCategories.map((category) => (
              <div key={category.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Category Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setNewCategories(prev => prev.map(cat => 
                          cat.id === category.id 
                            ? { ...cat, showDescription: !cat.showDescription }
                            : cat
                        ));
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-gray-100"
                    >
                      {category.showDescription ? 'Hide' : 'Show'} Details
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Cards Area - Gray background */}
                <div className="py-4">
                  {/* Section Description Toggle */}
                  {category.showDescription && (
                    <div className="mb-4 px-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {category.title === 'Key Concepts' && 
                          `This foundational section establishes the core principles and fundamental building blocks of React development. The cards work together to create a comprehensive understanding of React's component-based architecture, state management, and rendering lifecycle. Each card builds upon the previous concepts, creating a logical progression from basic JSX syntax to advanced component patterns. Understanding these key concepts is essential for building scalable, maintainable React applications. The cards cover essential topics like component composition, props and state management, event handling, and the virtual DOM. This knowledge serves as the foundation for all advanced React development and provides the necessary context for understanding more complex patterns and optimizations.`
                        }
                        {category.title === 'Advanced Topics' && 
                          `This section delves into sophisticated React patterns and techniques that elevate your development skills beyond the basics. The cards explore advanced concepts like custom hooks, context API optimization, performance tuning, and advanced state management patterns. Each card introduces complex topics that build upon the foundational knowledge established in the Key Concepts section. These advanced techniques enable developers to create more efficient, maintainable, and scalable applications. The cards cover topics such as memoization strategies, code splitting, lazy loading, and advanced component composition patterns. Understanding these concepts is crucial for building enterprise-level applications and optimizing React performance in production environments.`
                        }
                        {category.title === 'Best Practices' && 
                          `This section consolidates industry-proven methodologies and coding standards that ensure your React applications are robust, maintainable, and performant. The cards present established best practices for component design, state management, performance optimization, and code organization. Each card represents a critical aspect of professional React development that has been refined through real-world application and community consensus. These practices help developers avoid common pitfalls, write cleaner code, and create applications that are easier to debug and maintain. The cards cover essential topics like component naming conventions, prop validation, error boundaries, testing strategies, and deployment considerations. Following these best practices ensures your code meets professional standards and is easier for team members to understand and contribute to.`
                        }
                        {category.title === 'State Management' && 
                          `This section explores various state management solutions for React applications, from traditional Redux to lightweight alternatives like Zustand and Jotai. The cards cover fundamental concepts, modern patterns, and best practices for managing application state efficiently. Whether you're building a small application or a large-scale enterprise solution, understanding how to manage state effectively is crucial for building maintainable and scalable React applications.`
                        }
                        {category.title === 'Testing & Quality' && 
                          `This section focuses on ensuring your React applications are robust, maintainable, and performant. The cards cover testing strategies, mock techniques, and quality assurance practices. From unit testing to end-to-end testing, this section provides the tools and knowledge to create high-quality, reliable React applications.`
                        }
                        {category.title.includes('New Category') && 
                          `This newly created section is ready to be populated with cards that will form a cohesive organizational structure. As you add cards to this section, they should be thematically related and work together to build a comprehensive understanding of the topic. Consider how each card contributes to the overall narrative and how they can be arranged to create a logical learning progression. The cards in this section will help users understand the relationships between different concepts and how they fit together to form a complete picture of the subject matter.`
                        }
                      </p>
                    </div>
                  )}
                  
                  {category.cards.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4">
                      {category.cards.map((card) => (
                        <Card 
                          key={card.id} 
                          card={card} 
                          onClick={() => {}} // No click handler for now
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Drop cards here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom Create Section Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              // TODO: Implement create section functionality
              console.log('Create section clicked');
            }}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>Create Section</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizeRightPanel;
