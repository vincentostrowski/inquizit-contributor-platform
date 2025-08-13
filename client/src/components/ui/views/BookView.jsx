import React, { useState } from 'react';
import BookCover from '../BookCover';
import MobileHeader from '../MobileHeader';
import SectionsList from '../SectionsList';
import CardsList from '../CardsList';
import { useCardSections } from '../../../hooks/useCardSections';
import { useBook } from '../../../context/BookContext';

const BookView = ({ onBack, bookData, headerColor, backgroundEndColor, buttonTextBorderColor, buttonCircleColor, onCardClick }) => {
  // Toggle state for view mode
  const [viewMode, setViewMode] = useState('cards'); // 'collapse' or 'cards'
  
  // Get current book and fetch sections with cards from database
  const { currentBook } = useBook();
  const { cardSections, loading, error } = useCardSections(currentBook);
  
  // Transform cardSections to match our component expectations
  // Map banner field to coverURL for SectionCard component
  const sections = cardSections.map(section => ({
    ...section,
    cards: section.cards.map(card => ({
      ...card,
      coverURL: card.banner // Map banner to coverURL
    }))
  }));

  const handleSectionClick = (sectionId) => {
    // Section click handler - future implementation
  };

  const handleCardClick = (card) => {
    if (onCardClick) {
      onCardClick(card);
    }
  };

  return (
    <div className="VIEW bg-white flex-1 flex flex-col overflow-hidden">
      {/* Header with 4 buttons */}
     <MobileHeader 
       headerColor={headerColor} 
       buttonTextBorderColor={buttonTextBorderColor}
       buttonCircleColor={buttonCircleColor}
     />
      
              {/* Scrollable content container with background, cover, title, description, and sections */}
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
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500">Loading sections...</div>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-20">
                <div className="text-red-500">Error: {error}</div>
              </div>
            )}
            
            {/* Content when loaded */}
            {!loading && !error && (
              <>
                {/* Book */}
                <div className="flex flex-col items-center justify-center gap-2 pt-8">
                  <BookCover 
                    coverURL={bookData?.cover} 
                    cardData={sections.flatMap(section => section.cards)}
                  />
                  {/* Title */}
                  <div className="bg-white rounded-t-[15%] w-full p-4">
                    <h1 className="TITLE text-lg font-semibold w-full text-center mb-2">
                      {bookData?.title || 'Untitled Book'}
                    </h1>
              
                  {/* Description */}
                  <p className="text-gray-700 text-xs leading-relaxed px-2">
                    {bookData?.description || 'No description available.'}
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
            <SectionsList 
              sections={sections}
              onSectionClick={handleSectionClick}
            />
          ) : (
            <CardsList 
              sections={sections}
              onSectionClick={handleSectionClick}
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

export default BookView;
