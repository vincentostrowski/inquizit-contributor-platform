import React from 'react';

const OverlappingCards = ({ cards }) => {
  return (
    <div className="relative h-52 w-full flex justify-center">
      {/* Centered container for the overlapping cards */}
      <div className="relative h-full w-48">
        {/* Card 1 - Main */}
        {cards[0] && (
          <div className="bg-orange-50 rounded-xl shadow-sm absolute top-0 left-0 z-30 p-2 w-40 h-52">
            {/* Cover Image */}
            <div className="w-full h-13 bg-gray-200 rounded-lg mb-2 overflow-hidden">
              {cards[0].coverURL ? (
                <img 
                  src={cards[0].coverURL} 
                  alt={cards[0].title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">📚</span>
                </div>
              )}
            </div>
            
            {/* Title */}
            <div className="text-xs font-medium text-gray-800 mb-1 line-clamp-2 leading-tight text-center">
              {cards[0].title}
            </div>
            
            {/* Description */}
            <div className="text-[10px] text-gray-600 leading-tight">
              {cards[0].description}
            </div>
            
            {/* Inquizit Badge */}
            <div className="absolute bottom-1 right-1">
              <span className="text-[8px] font-medium px-1 py-0.5 text-gray-500">
                Inquizit
              </span>
            </div>
          </div>
        )}

        {/* Card 2 - overlaps from right */}
        {cards[1] && (
          <div className="bg-orange-50 rounded-xl shadow-sm absolute top-0 left-4 z-20 p-2 w-40 h-52">
            {/* Cover Image */}
            <div className="w-full h-13 bg-gray-200 rounded-lg mb-2 overflow-hidden">
              {cards[1].coverURL ? (
                <img 
                  src={cards[1].coverURL} 
                  alt={cards[1].title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">📚</span>
                </div>
              )}
            </div>
            
            
          </div>
        )}

        {/* Card 3 - overlaps from right */}
        {cards[2] && (
          <div className="bg-orange-50 rounded-xl shadow-sm absolute top-0 left-8 z-10 p-2 w-40 h-52">
            {/* Cover Image */}
            <div className="w-full h-13 bg-gray-200 rounded-lg mb-2 overflow-hidden">
              {cards[2].coverURL ? (
                <img 
                  src={cards[2].coverURL} 
                  alt={cards[2].title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">📚</span>
                </div>
              )}
            </div>
            
            
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlappingCards;
