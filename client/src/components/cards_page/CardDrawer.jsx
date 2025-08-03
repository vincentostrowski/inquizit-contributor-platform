import React, { useState, useEffect } from 'react';
import CardGrid from './CardGrid';

// Mock data for testing - different cards for different sections
const mockCards = [
  {
    id: 1,
    title: "Question Defaults",
    description:
      "Originality begins with curiosity about why existing systems work the way they do, rather than accepting them as natural or inevitable.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
  {
    id: 2,
    title: "Risk Portfolio",
    description:
      "Successful originals balance extreme risks in one domain with extreme caution in another, rather than taking moderate risks across the board.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
  {
    id: 3,
    title: "Originality is Not a Fixed Trait",
    description:
      "Originality is not an innate personality characteristic but a conscious choice that anyone can make.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
  {
    id: 4,
    title: "The Power of Procrastination",
    description:
      "Strategic procrastination can lead to better ideas by allowing time for incubation and avoiding premature closure on solutions.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
  {
    id: 5,
    title: "Diversify Your Identity",
    description:
      "People who have multiple identities are more likely to take creative risks because failure in one domain doesn't threaten their entire sense of self.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
  {
    id: 6,
    title: "The Middle Status Trap",
    description:
      "Those in the middle of hierarchies often conform more than those at the top or bottom, as they have the most to lose from standing out.",
    prompt: null,
    section: null,
    book: 2,
    order: null,
    banner: null,
  },
];

const CardDrawer = ({ selectedSection }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cards when selectedSection changes
  useEffect(() => {
    if (selectedSection) {
      setLoading(true);
      // Simulate API call with mock data
      setTimeout(() => {
        const sectionCards = mockCards;
        setCards(sectionCards);
        setLoading(false);
      }, 300);
    } else {
      setCards([]);
    }
  }, [selectedSection]);

  const handleCreateCard = () => {
    console.log('Create card clicked for section:', selectedSection?.id);
    // TODO: Implement card creation logic
  };

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
    // TODO: Implement card detail view
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {selectedSection?.title || 'No section selected'}
          </h1>
          <button
            onClick={() => {}}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <span>Generate</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6">
            <CardGrid 
              cards={cards} 
              onCardClick={handleCardClick}
              onCreateCard={handleCreateCard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDrawer; 