import React from 'react';
import Card from '../Card';

const CardTab = ({ formData, handleInputChange, handleGenerate }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Card Preview */}
      <div className="flex justify-center mb-6">
        <Card 
          card={{
            title: formData.title || 'Card Title',
            description: formData.description || 'Card description will appear here...'
          }}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium">Title</label>
            <button
              onClick={() => handleGenerate('title')}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <span>Prompt</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter card title..."
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              Recommended: 40-50 characters
            </span>
            <span className={`text-xs ${
              (formData.title?.length || 0) > 50 
                ? 'text-red-600' 
                : (formData.title?.length || 0) > 40 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {(formData.title?.length || 0)} / 50
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium">Description</label>
            <button
              onClick={() => handleGenerate('description')}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <span>Prompt</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded h-24 resize-none"
            placeholder="Enter card description..."
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              Recommended: 100-130 characters
            </span>
            <span className={`text-xs ${
              (formData.description?.length || 0) > 130 
                ? 'text-red-600' 
                : (formData.description?.length || 0) > 100 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {(formData.description?.length || 0)} / 130
            </span>
          </div>
        </div>

        {/* Banner Upload */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium">Banner Image</label>
            <button
              onClick={() => {
                const prompt = `Generate a banner image for a card with title: "${formData.title || 'Card Title'}" and description: "${formData.description || 'Card description'}"`;
                navigator.clipboard.writeText(prompt);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <span>Prompt</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          {/* Banner Preview */}
          {formData.banner && (
            <div className="mb-3">
              <img 
                src={formData.banner} 
                alt="Card banner" 
                className="w-full h-32 object-cover rounded border border-gray-200"
              />
            </div>
          )}
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleInputChange('banner', event.target.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="banner-upload"
            />
            <label 
              htmlFor="banner-upload" 
              className="cursor-pointer block"
            >
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {formData.banner ? 'Click to change banner image' : 'Click to upload banner image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </label>
          </div>
          
          {/* Remove Banner Button */}
          {formData.banner && (
            <button
              onClick={() => handleInputChange('banner', '')}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Remove banner
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardTab; 