import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

const Card = ({ card, onClick, index, onDragStart, onDragEnd, showRemoveButton, onRemove, sectionId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!card) return null;

  const BaseCard = ({ dragClassName = '', dragStyle, dragHandlers = {} }) => (
    <div
      className={`w-64 h-80 bg-[#F8F5F0] rounded-2xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 relative ${dragClassName}`}
      style={dragStyle}
      onClick={() => {
        if (!isDragging) {
          onClick?.(card);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!!onDragStart} // Make draggable if onDragStart is provided
      onDragStart={(e) => {
        if (onDragStart) {
          setIsDragging(true);
          onDragStart(card);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onDragEnd={(e) => {
        if (onDragEnd) {
          setIsDragging(false);
          onDragEnd(e);
        }
      }}
      {...dragHandlers}
    >
      <div className="flex flex-col h-full">
        {/* Banner */}
        <div className="rounded-t-2xl h-24 flex-shrink-0 p-3">
          {/* Remove Button - Only show when hovering and showRemoveButton is true */}
          {showRemoveButton && isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                onRemove?.(sectionId, card.id);
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors"
              title="Remove card from section"
            >
              ×
            </button>
          )}
          <div className="relative w-full h-full rounded-lg overflow-hidden ring-1 ring-black/5">
            {card.banner ? (
              <>
                {(() => {
                  const isDataUrl = typeof card.banner === 'string' && card.banner.startsWith('data:');
                  const src = isDataUrl
                    ? card.banner
                    : `${card.banner}${card.banner.includes('?') ? '&' : '?'}v=${card.updated_at || ''}`;
                  return (
                    <img
                      src={src}
                      key={src}
                      alt="Card banner"
                      className="w-full h-full object-cover saturate-[.92] contrast-[.95]"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-[#F8F5F0]/25" />
              </>
            ) : (
              <div className="w-full h-full bg-[#A37C7C]" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 pt-0 flex flex-col">
          <h3 className="font-bold text-gray-900 text-lg leading-tight text-center mb-3">
            {card.title}
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed overflow-hidden">
            {card.description}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-gray-500">Inquizit</div>
    </div>
  );

  // Draggable mode for grid usage
  if (typeof index === 'number') {
    return (
      <Draggable
        draggableId={card?.id?.toString() || 'temp'}
        index={index}
        mode="FLUID"
        onDragStart={() => setIsDragging(true)}
      >
        {(provided, snapshot) => (
          <BaseCard
            dragClassName={snapshot.isDragging ? 'opacity-50' : ''}
            dragStyle={{
              ...provided.draggableProps.style,
              // Constrain to horizontal movement only
              transform: provided.draggableProps.style?.transform
                ? provided.draggableProps.style.transform.replace(/translate\(([^,]+),\s*[^)]+\)/, 'translate($1, 0px)')
                : undefined,
            }}
            dragHandlers={{
              ref: provided.innerRef,
              ...provided.draggableProps,
              ...provided.dragHandleProps,
            }}
          />
        )}
      </Draggable>
    );
  }

  // Non-draggable preview usage
  return <BaseCard />;
};

export default Card;
 
