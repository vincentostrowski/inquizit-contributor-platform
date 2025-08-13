import React, { useState } from 'react';
import MobileHeader from '../MobileHeader';
import OverlappingCards from './SectionView/OverlappingCards';
import HorizontalCardsRow from './SectionView/HorizontalCardsRow';

const SectionView = ({ onBack, headerColor, backgroundEndColor, buttonTextBorderColor, buttonCircleColor, sectionId, cardSections, onCardClick }) => {
  // Toggle state for view mode
  const [viewMode, setViewMode] = useState('cards'); // 'collapse' or 'cards'
  
  // Find the selected section from passed data
  const selectedSection = cardSections?.find(section => section.id === sectionId);
  
  // Transform section data to match our component expectations
  const section = selectedSection ? {
    ...selectedSection,
    cards: selectedSection.cards.map(card => ({
      ...card,
      coverURL: card.banner // Map banner to coverURL
    }))
  } : null;

  const handleSectionClick = (sectionId) => {
    // Section click handler - future implementation
  };

  const handleCardClick = (card) => {
    if (onCardClick) {
      onCardClick(card);
    }
  };

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Section not found</div>
      </div>
    );
  }

  return (
    <div className="VIEW bg-white flex-1 flex flex-col overflow-hidden">
      {/* Header with 4 buttons */}
      <MobileHeader 
        headerColor={headerColor} 
        buttonTextBorderColor={buttonTextBorderColor}
        buttonCircleColor={buttonCircleColor}
        onBack={onBack}
      />
      
      {/* Scrollable content container with background, title, description, and cards */}
      <div className="flex-1 overflow-y-auto min-h-0 relative pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Background gradient - positioned as background */}
        <div 
          className="absolute -top-0 left-0 w-full h-72 z-0"
          style={{
            background: `linear-gradient(to bottom, ${headerColor}, ${backgroundEndColor})`
          }}
        />
        
        {/* Content that flows over the background */}
        <div className="relative">
          {/* Content */}
          {section && (
            <>
              {/* Section Header */}
              <div className="flex flex-col items-center justify-center gap-2 pt-8">
                {/* First 3 Cards Display - Using OverlappingCards Component */}
                <OverlappingCards 
                  cards={section.cards} 
                />

                {/* Section Title and Description */}
                <div className="bg-white rounded-t-[15%] w-full p-4">
                  <h1 className="TITLE text-lg font-semibold w-full text-center mb-2 px-2">
                    {section.title || 'Untitled Section'}
                  </h1>
              
                  {/* Description */}
                  <p className="text-gray-700 text-xs leading-relaxed px-2">
                    {section.description || 'No description available.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-end px-6 py-2">
                {/* Card List View Button */}
                <button 
                  onClick={() => setViewMode('cards')}
                  className="p-2"
                >
                  <div className="flex items-center gap-0.5">
                    <div className={`w-1 h-2.5 ${
                      viewMode === 'cards' ? 'bg-black' : 'bg-gray-400'
                    }`}></div>
                    <div className={`w-1 h-2.5 ${
                      viewMode === 'cards' ? 'bg-black' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </button>
                 
                {/* Collapse Menu View Button */}
                <button 
                  onClick={() => setViewMode('collapse')}
                  className="p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className={`w-2.5 h-0.5 ${
                      viewMode === 'collapse' ? 'bg-black' : 'bg-gray-400'
                    }`}></div>
                    <div className={`w-2.5 h-0.5 ${
                      viewMode === 'collapse' ? 'bg-black' : 'bg-gray-400'
                    }`}></div>
                    <div className={`w-2.5 h-0.5 ${
                      viewMode === 'collapse' ? 'bg-black' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </button>
              </div>

              {/* Section Components - Conditional Rendering */}
              {viewMode === 'collapse' ? (
                <div className="px-4 pb-6 space-y-3">
                  {/* Show all sections in collapse mode */}
                  {cardSections.map((s) => (
                    <div 
                      key={s.id}
                      className="bg-white rounded-2xl border border-gray-300 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSectionClick(s.id)}
                    >
                      <span className="text-xs font-normal text-gray-900">{s.title}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">{s.cards?.length || 0} cards</span>
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <HorizontalCardsRow 
                  cards={section.cards} 
                  onCardClick={handleCardClick} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionView;
