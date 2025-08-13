import React from 'react';

const SectionComponent = ({ title, progressPercentage, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-gray-300 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <span className="text-xs font-normal text-gray-900">{title}</span>
      <div className="flex items-center space-x-3">
        {/* Progress Bar */}
        <div className="w-16 h-0.5 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        {/* Triangle */}
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-500"></div>
      </div>
    </div>
  );
};

export default SectionComponent;
