import React from 'react';

const FullCard = ({ card, onBack }) => {
  if (!card) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">No card selected</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="ml-3 text-lg font-semibold text-gray-900">Card Details</h2>
      </div>

      {/* Card Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Cover Image */}
        {card.banner && (
          <div className="mb-6">
            <img
              src={card.banner}
              alt={card.title}
              className="w-full h-48 object-cover rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{card.title}</h1>
        </div>

        {/* Description */}
        {card.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h3>
            <p className="text-gray-700 leading-relaxed">{card.description}</p>
          </div>
        )}

        {/* Card Idea */}
        {card.card_idea && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Card Idea</h3>
            <p className="text-gray-700 leading-relaxed">{card.card_idea}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Order:</span> {card.final_order || card.order}
            </div>
            <div>
              <span className="font-medium">ID:</span> {card.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullCard;
