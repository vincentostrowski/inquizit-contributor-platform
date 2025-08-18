import React from 'react';
import MobileHeader from '../MobileHeader';
import FullCard from './CardView/FullCard';

const CardView = ({ card, onBack, headerColor, backgroundEndColor, buttonTextBorderColor, buttonCircleColor, bookData, cardSections }) => {
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

        {/* Background gradient with book cover overlay - positioned as background */}
        <div 
          className="absolute -top-0 left-0 w-full h-52 z-0 rounded-b-[15%]"
          style={{
            background: bookData?.cover || bookData?.banner ? 
              `linear-gradient(to bottom, ${headerColor}, ${backgroundEndColor})` :
              `linear-gradient(to bottom, ${headerColor}, ${backgroundEndColor})`
          }}
        >
        </div>

        {/* Use FullCard for the card content display */}
        <FullCard card={card} />

        {/* Card Content Section */}
        {(() => {
          // Find the card content from the passed data
          const cardWithContent = cardSections?.flatMap(section => section.cards).find(c => c.id === card?.id);
          const content = cardWithContent?.content;
          
          if (content) {
            return (
              <div className="mt-6">
                <div className="text-gray-700 leading-relaxed text-xs whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};

export default CardView;

