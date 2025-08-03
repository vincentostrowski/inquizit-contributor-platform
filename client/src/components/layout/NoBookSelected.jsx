import React from 'react';

const NoBookSelected = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Select a book to edit
        </h2>
        <p className="text-gray-500">
          Choose a book from the sidebar to start editing
        </p>
      </div>
    </div>
  );
};

export default NoBookSelected; 