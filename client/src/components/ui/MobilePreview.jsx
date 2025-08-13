import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import BookView from './views/BookView';
import SectionView from './views/SectionView';
import CardView from './views/CardView';
import QuizitView from './views/QuizitView';

const MobilePreview = ({ bookData, headerColor, backgroundEndColor, buttonTextBorderColor, buttonCircleColor }) => {
  // View constants
  const VIEWS = {
    BOOK_VIEW: 'BOOK_VIEW',
    SECTION_VIEW: 'SECTION_VIEW',
    CARD_VIEW: 'CARD_VIEW',
    QUIZIT_VIEW: 'QUIZIT_VIEW'
  };

  // State for routing
  const [currentView, setCurrentView] = useState(VIEWS.BOOK_VIEW);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardSectionsData, setCardSectionsData] = useState(null);

  // Function to determine if a color is light or dark (moved inline where needed)
  const getContrastColor = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Router function
  const renderCurrentView = () => {
    switch (currentView) {
      case VIEWS.BOOK_VIEW:
        return <BookView 
          bookData={bookData} 
          headerColor={headerColor}
          backgroundEndColor={backgroundEndColor}
          buttonTextBorderColor={buttonTextBorderColor}
          buttonCircleColor={buttonCircleColor}
          onCardClick={(card) => {
            setSelectedCard(card);
            setCurrentView(VIEWS.CARD_VIEW);
          }}
          onSectionClick={(sectionId) => {
            setSelectedSection(sectionId);
            setCurrentView(VIEWS.SECTION_VIEW);
          }}
          onDataLoaded={(data) => {
            // Only update if we don't already have data or if it's different
            if (!cardSectionsData || JSON.stringify(cardSectionsData) !== JSON.stringify(data)) {
              setCardSectionsData(data);
            }
          }}
          existingData={cardSectionsData}
        />;
      case VIEWS.SECTION_VIEW:
        return <SectionView 
          onBack={() => setCurrentView(VIEWS.BOOK_VIEW)} 
          headerColor={headerColor}
          backgroundEndColor={backgroundEndColor}
          buttonTextBorderColor={buttonTextBorderColor}
          buttonCircleColor={buttonCircleColor}
          sectionId={selectedSection}
          cardSections={cardSectionsData}
          onCardClick={(card) => {
            setSelectedCard(card);
            setCurrentView(VIEWS.CARD_VIEW);
          }}
        />;
      case VIEWS.CARD_VIEW:
        return <CardView 
          card={selectedCard} 
          onBack={() => setCurrentView(VIEWS.BOOK_VIEW)} 
          headerColor={headerColor}
          backgroundEndColor={backgroundEndColor}
          buttonTextBorderColor={buttonTextBorderColor}
          buttonCircleColor={buttonCircleColor}
          bookData={bookData}
          cardSections={cardSectionsData}
        />;
      case VIEWS.QUIZIT_VIEW:
        return <QuizitView />;
      default:
        return <BookView 
          bookData={bookData}
          headerColor={headerColor}
          backgroundEndColor={backgroundEndColor}
          buttonTextBorderColor={buttonTextBorderColor}
          buttonCircleColor={buttonCircleColor}
          onCardClick={(card) => {
            setSelectedCard(card);
            setCurrentView(VIEWS.CARD_VIEW);
          }}
          onSectionClick={(sectionId) => {
            setSelectedSection(sectionId);
            setCurrentView(VIEWS.SECTION_VIEW);
          }}
          onDataLoaded={(data) => {
            // Only update if we don't already have data or if it's different
            if (!cardSectionsData || JSON.stringify(cardSectionsData) !== JSON.stringify(data)) {
              setCardSectionsData(data);
            }
          }}
          existingData={cardSectionsData}
        />;
    }
  };

  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="FRAME w-[420px] h-[850px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Phone Screen */}
        <div className="SCREEN w-full h-full bg-white rounded-[2.5rem] relative flex flex-col overflow-hidden">
          {/* Status Bar */}
          <div 
            className="h-8 flex items-center justify-between px-6 text-xs"
            style={{ 
              backgroundColor: headerColor,
              color: getContrastColor(headerColor)
            }}
          >
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-2 rounded-sm"
                style={{ backgroundColor: getContrastColor(headerColor) }}
              ></div>
              <div 
                className="w-6 h-2 rounded-sm"
                style={{ backgroundColor: getContrastColor(headerColor) }}
              ></div>
            </div>
          </div>
          
          {/* Main Content Area - Dynamic Views */}
          {renderCurrentView()}
          
          {/* Bottom Navigation Bar - Fixed on Library */}
          {cardSectionsData && cardSectionsData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-around items-center">
              {/* Home */}
              <div className="flex flex-col items-center">
                <Icon icon="mdi:home" className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">Home</span>
              </div>
              
              {/* Library - Active */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Icon icon="material-symbols:library-books" className="w-5 h-5 text-gray-700" />
                </div>
                <span className="text-xs text-gray-700 font-medium mt-1">Library</span>
              </div>
              
              {/* Schedule */}
              <div className="flex flex-col items-center">
                <Icon icon="mdi:calendar" className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">Schedule</span>
              </div>
              
              {/* Me */}
              <div className="flex flex-col items-center">
                <Icon icon="mdi:account" className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">Me</span>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Phone Label */}
      <div className="text-center mt-6">
        <p className="text-lg font-medium text-gray-700">Mobile App Preview</p>
        <p className="text-sm text-gray-500">Phone frame ready for content</p>
      </div>
    </div>
  );
};

export default MobilePreview;
