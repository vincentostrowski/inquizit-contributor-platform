import React from 'react';

const SectionComponent = ({ title, cardCount, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-gray-300 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <span className="text-xs font-normal text-gray-900">{title}</span>
      <div className="flex items-center space-x-3">
        {/* Card Count */}
        <span className="text-xs text-gray-500">{cardCount} cards</span>
        {/* Triangle */}
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-500"></div>
      </div>
    </div>
  );
};

export default SectionComponent;
