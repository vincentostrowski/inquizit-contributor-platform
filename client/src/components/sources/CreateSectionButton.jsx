import React from 'react';

const CreateSectionButton = ({ onClick, label = "Create a Section", className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full mt-2 p-3 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-300 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="font-medium text-blue-600">{label}</span>
      </div>
    </button>
  );
};

export default CreateSectionButton; 