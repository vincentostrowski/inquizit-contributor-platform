import React from 'react';

const SectionCard = ({ title, description, coverURL, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-orange-50 rounded-lg border border-gray-200 p-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow flex-shrink-0 h-46 relative"
      style={{ minWidth: '120px', maxWidth: '140px' }}
    >
      {/* Cover Image */}
      <div className="w-full h-12 bg-gray-200 rounded-md mb-2 overflow-hidden">
        {coverURL ? (
          <img 
            src={coverURL} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-gray-500 text-xs">📚</span>
          </div>
        )}
      </div>
      
      {/* Title */}
      <div className="text-[10px] font-medium text-gray-800 mb-1 line-clamp-2 leading-tight text-center">
        {title}
      </div>
      
      {/* Description */}
      <div className="text-[8px] text-gray-600 leading-tight">
        {description}
      </div>
      
      {/* Inquizit Badge */}
      <div className="absolute bottom-1 right-1">
        <span className="text-[6px] font-xs px-1.5 py-0.5 text-gray-500">
          Inquizit
        </span>
    </div>
    </div>
  );
};

export default SectionCard;
