import React from 'react';

const HorizontalCardsRow = ({ cards, onCardClick }) => {
  return (
    <div className="px-4 pb-6">
      {/* Cards - Horizontal scrollable row */}
      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-orange-50 rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-72"
            onClick={() => onCardClick(card)}
          >
            {/* Cover Image */}
            <div className="w-full h-32 bg-gray-200 rounded-md mb-4 overflow-hidden">
              {card.coverURL ? (
                <img 
                  src={card.coverURL} 
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">📚</span>
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
        ))}
      </div>
    </div>
  );
};

export default HorizontalCardsRow;
