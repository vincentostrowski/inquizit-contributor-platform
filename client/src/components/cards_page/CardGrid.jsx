import React from 'react';
import Card from './Card';

const AddCardPlaceholder = ({ onClick }) => {
  return (
    <div 
      className="w-64 h-80 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
      onClick={onClick}
    >
      <div className="text-center">
        <div className="text-4xl text-gray-400 mb-2">+</div>
        <p className="text-sm text-gray-500">Add New Card</p>
      </div>
    </div>
  );
};

const CardGrid = ({ cards, onCardClick, onCreateCard, cardSetDone }) => {
  // If no cards and card set is not done, show just the add card placeholder
  if (cards.length === 0 && !cardSetDone) {
    return (
      <div className="flex justify-start p-10">
        <AddCardPlaceholder onClick={onCreateCard} />
      </div>
    );
  }

  // If card set is done, don't show add card placeholder
  if (cardSetDone) {
    return (
      <div className="flex gap-6 overflow-x-auto custom-scrollbar p-10">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            card={card} 
            onClick={onCardClick}
          />
        ))}
      </div>
    );
  }

  // Normal case: show cards with add card placeholder
  return (
    <div className="flex gap-6 overflow-x-auto custom-scrollbar p-10">
      <AddCardPlaceholder onClick={onCreateCard} />
      {cards.map((card) => (
        <Card 
          key={card.id} 
          card={card} 
          onClick={onCardClick}
        />
      ))}
    </div>
  );
};

export default CardGrid; 