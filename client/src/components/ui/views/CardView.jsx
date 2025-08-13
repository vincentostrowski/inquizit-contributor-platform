import React from 'react';
import MobileHeader from '../MobileHeader';
import { useCardContent } from '../../../hooks/useCardContent';

const CardView = ({ card, onBack, headerColor, backgroundEndColor, buttonTextBorderColor, buttonCircleColor, bookData }) => {
  const { content, loading: contentLoading, error: contentError } = useCardContent(card?.id);

  if (!card) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">No card selected</div>
      </div>
    );
  }

  return (
    <div className="VIEW bg-white flex-1 flex flex-col overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Header */}
      <MobileHeader 
        headerColor={headerColor} 
        buttonTextBorderColor={buttonTextBorderColor}
        buttonCircleColor={buttonCircleColor}
        onBack={onBack}
      />
      
      
      <div className="flex-1 overflow-y-auto min-h-0 relative p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-32">

        {/* Background gradient - positioned as background */}
        <div 
            className="absolute -top-0 left-0 w-full h-72 z-0 rounded-b-[3%]"
            style={{
              background: `linear-gradient(to bottom, ${headerColor}, ${backgroundEndColor})`
            }}
          />

        {/* Card Content - using SectionCard design */}
        <div className="bg-orange-50 rounded-lg border border-gray-200 p-4 shadow-sm max-w-md mx-auto w-72 relative">
          {/* Cover Image Container - Relative for positioning */}
          <div className="relative w-full h-32 mb-4">
            {/* Card Banner - Background */}
            <div className="w-full h-32 bg-gray-200 rounded-md overflow-hidden">
              {card.banner || card.coverURL ? (
                <img 
                  src={card.banner || card.coverURL} 
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">📚</span>
                </div>
              )}
            </div>
            
            {/* Book Cover - Positioned in front */}
            {bookData?.cover && (
              <div className="absolute bottom-1 left-1 w-18 h-26">
                <img
                  src={bookData.cover}
                  alt="Book cover"
                  className="w-full h-full object-fill rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
          
          {/* Title */}
          <div className="text-lg font-medium text-gray-800 mb-3 text-center">
            {card.title}
          </div>
          
          {/* Description */}
          {card.description && (
            <div className="text-sm text-gray-600 mb-4 leading-relaxed">
              {card.description}
            </div>
          )}
          
          {/* Inquizit Badge */}
          <div className="flex justify-end">
            <span className="text-xs font-medium px-2 py-1 text-gray-500">
              Inquizit
            </span>
          </div>
        </div>

        {/* Card Content Section */}
        {contentLoading && (
          <div className="mt-6 text-center">
            <div className="text-gray-500 text-sm">Loading content...</div>
          </div>
        )}
        
        {contentError && (
          <div className="mt-6 text-center">
            <div className="text-red-500 text-sm">Error loading content: {contentError}</div>
          </div>
        )}
        
        {content && !contentLoading && !contentError && (
          <div className="mt-6">
              <div className="text-gray-700 leading-relaxed text-xs whitespace-pre-wrap">
                {content}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CardView;

