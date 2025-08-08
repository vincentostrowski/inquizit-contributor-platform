import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Card = ({ card, onClick, index }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Safety check - don't render if no card data
  if (!card) {
    return null;
  }

  const cardContent = (
    <div 
      className={`w-64 h-80 bg-[#F8F5F0] rounded-2xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0`}
      onClick={() => {
        if (!isDragging) {
          onClick?.(card);
        }
        setIsDragging(false);
      }}
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

  // Only wrap with Draggable if index is provided (for grid usage)
  if (typeof index === 'number') {
    return (
      <Draggable 
        draggableId={card?.id?.toString() || 'temp'} 
        index={index} 
        mode="FLUID"
        onDragStart={() => setIsDragging(true)}
      >
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`w-64 h-80 bg-[#F8F5F0] rounded-2xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 ${
              snapshot.isDragging ? 'opacity-50' : ''
            }`}
            style={{
              ...provided.draggableProps.style,
              // Constrain to horizontal movement only
              transform: provided.draggableProps.style?.transform 
                ? provided.draggableProps.style.transform.replace(/translate\(([^,]+),\s*[^)]+\)/, 'translate($1, 0px)')
                : undefined
            }}
            onClick={() => {
              if (!isDragging) {
                onClick?.(card);
              }
              setIsDragging(false);
            }}
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
        )}
      </Draggable>
    );
  }

  // Return regular card for preview usage (no drag functionality)
  return cardContent;
};

export default Card; 