import React from 'react';

const Card = ({ card, onClick }) => {
  return (
    <div 
      className="w-64 h-80 bg-[#F8F5F0] rounded-2xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0"
      onClick={() => onClick?.(card)}
    >
      <div className="flex flex-col h-full">
        {/* Top Colored Block */}
        <div className="rounded-t-2xl h-24 flex-shrink-0 p-3">
          <div className="bg-[#A37C7C] rounded-lg w-full h-full"></div>
        </div>
        {/* Content Area */}
        <div className="flex-1 p-4 pt-0 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-lg leading-tight text-center mb-3">
            {card.title}
          </h3>

          {/* Description */}
          <p className="text-gray-700 text-sm leading-relaxed overflow-hidden">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card; 