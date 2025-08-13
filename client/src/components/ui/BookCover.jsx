import React from 'react';

const BookCover = ({ 
  size = "default", // "default", "small", "large"
  coverURL = null,
  cardData = [] // Array of cards with banner/cover images
}) => {
  const sizeClasses = {
    default: "w-38 h-52",
    small: "w-32 h-44", 
    large: "w-44 h-60"
  };

  // Extract first 3 cards with images for the overlapping divs
  const getFirstThreeCards = () => {
    const cardsWithImages = cardData.filter(card => card.banner || card.coverURL);
    return cardsWithImages.slice(0, 3);
  };

  const overlappingCards = getFirstThreeCards();

  return (
    <div className="relative h-52 w-full flex justify-center mb-4">
      {/* Centered container for the overlapping divs */}
      <div className="relative h-full w-50">
        {/* Book Cover */}
        {coverURL ? (
        <img
          src={coverURL}
          alt="Book cover"
          className={`${sizeClasses[size]} object-fill rounded-xl shadow-sm absolute top-0 left-0 z-30`}
        />
        ) : (
          <div className={`${sizeClasses[size]} bg-teal-50 rounded-xl shadow-sm absolute top-0 left-0 z-30`}></div>
        )}

        {/* Div 1 - overlaps cover from right */}
        {overlappingCards[0] ? (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-4 z-20 p-2`}>
            <img
              src={overlappingCards[0].banner || overlappingCards[0].coverURL}
              alt="Card 1"
              className="w-full h-13 rounded-lg object-cover"
            />
          </div>
        ) : (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-4 z-20 p-2`}>
            <div className="bg-gray-300 w-full h-13 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Card</span>
            </div>
          </div>
        )}
        
        {/* Div 2 - overlaps div 1 from right */}
        {overlappingCards[1] ? (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-8 z-10 p-2`}>
            <img
              src={overlappingCards[1].banner || overlappingCards[1].coverURL}
              alt="Card 2"
              className="w-full h-13 rounded-lg object-cover"
            />
          </div>
        ) : (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-8 z-10 p-2`}>
            <div className="bg-gray-300 w-full h-13 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Card</span>
            </div>
          </div>
        )}
        
        {/* Div 3 - overlaps div 2 from right */}
        {overlappingCards[2] ? (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-12 z-0 p-2`}>
            <img
              src={overlappingCards[2].banner || overlappingCards[2].coverURL}
              alt="Card 3"
              className="w-full h-13 rounded-lg object-cover"
            />
          </div>
        ) : (
          <div className={`${sizeClasses[size]} bg-orange-50 rounded-xl shadow-sm absolute top-0 left-12 z-0 p-2`}>
            <div className="bg-gray-300 w-full h-13 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">No Card</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCover;
