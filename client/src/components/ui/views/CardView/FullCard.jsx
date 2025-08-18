import React from 'react';

const FullCard = ({ card }) => {
  if (!card) {
    return null;
  }

  return (
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
  );
};

export default FullCard;
