import React from 'react';

const SourcesTab = ({ formData, handleInputChange, handleGenerate }) => {
      return (
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Sources */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded p-3">
                <div className="text-sm text-gray-600 mb-2">Section Outside / Section Inside</div>
                <div className="text-sm text-gray-500">
                  This is generated to give user more context into understanding what this card is meant for. Will probably be used in Content generation as well. Way smaller than content, but enough for needed context.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Source Snippet */}
        <div className="border border-gray-200 rounded p-3">
          <textarea
            className="w-full p-2 border border-gray-300 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Enter new source snippet content..."
          />
        </div>
      </div>
    );
};

export default SourcesTab; 