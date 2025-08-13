import React from 'react';

const SectionView = ({ onBack }) => {
  return (
    <div className="bg-green-200 h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Section View</h2>
        <p className="text-green-700">📚 Section content will go here</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default SectionView;
