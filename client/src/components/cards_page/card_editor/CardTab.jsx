import React, { useState } from 'react';
import Card from '../Card';
import ImageReferenceSelector from './ImageReferenceSelector';

const CardTab = ({ formData, handleInputChange, handleGenerate, buildTitlePrompt, buildDescriptionPrompt, buildBannerPrompt, fieldCompletion, onFieldCompletionToggle }) => {
  const [titleCopied, setTitleCopied] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [bannerCopied, setBannerCopied] = useState(false);
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Card Preview */}
      <div className="flex justify-center mb-6">
        <Card 
          card={{
            title: formData.title || 'Card Title',
            description: formData.description || 'Card description will appear here...',
            banner: formData.banner || ''
          }}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Title</label>
              
              {/* Completion toggle */}
              <button
                onClick={() => onFieldCompletionToggle && onFieldCompletionToggle('title', !fieldCompletion?.title)}
                className={`w-4 h-4 rounded border-2 transition-colors ${
                  fieldCompletion?.title 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
                title={fieldCompletion?.title ? 'Mark title as incomplete' : 'Mark title as complete'}
              >
                {fieldCompletion?.title && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Prompt button */}
              <button
                onClick={() => {
                  const prompt = buildTitlePrompt();
                  navigator.clipboard.writeText(prompt);
                  setTitleCopied(true);
                  setTimeout(() => setTitleCopied(false), 3000);
                }}
                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                title="Copy prompt to clipboard"
              >
                {titleCopied ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs">Prompt</span>
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
            <div className="flex items-center space-x-2">
              <label className="font-medium">Description</label>
              
              {/* Completion toggle */}
              <button
                onClick={() => onFieldCompletionToggle && onFieldCompletionToggle('description', !fieldCompletion?.description)}
                className={`w-4 h-4 rounded border-2 transition-colors ${
                  fieldCompletion?.description 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
                title={fieldCompletion?.description ? 'Mark description as incomplete' : 'Mark description as complete'}
              >
                {fieldCompletion?.description && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Prompt button */}
              <button
                onClick={() => {
                  const prompt = buildDescriptionPrompt();
                  navigator.clipboard.writeText(prompt);
                  setDescriptionCopied(true);
                  setTimeout(() => setDescriptionCopied(false), 3000);
                }}
                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                title="Copy prompt to clipboard"
              >
                {descriptionCopied ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs">Prompt</span>
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
            <div className="flex items-center space-x-2">
              <label className="font-medium">Banner Image</label>
              
              {/* Completion toggle */}
              <button
                onClick={() => onFieldCompletionToggle && onFieldCompletionToggle('banner', !fieldCompletion?.banner)}
                className={`w-4 h-4 rounded border-2 transition-colors ${
                  fieldCompletion?.banner 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
                title={fieldCompletion?.banner ? 'Mark banner as incomplete' : 'Mark banner as complete'}
              >
                {fieldCompletion?.banner && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Prompt button */}
              <button
                onClick={() => {
                  const prompt = buildBannerPrompt();
                  navigator.clipboard.writeText(prompt);
                  setBannerCopied(true);
                  setTimeout(() => setBannerCopied(false), 3000);
                }}
                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                title="Copy prompt to clipboard"
              >
                {bannerCopied ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs">Prompt</span>
              </button>
          </div>
          
          {/* Banner Preview */}
          {formData.banner && (
            <div className="mb-3">
              {(() => {
                const isDataUrl = typeof formData.banner === 'string' && formData.banner.startsWith('data:');
                const src = isDataUrl
                  ? formData.banner
                  : `${formData.banner}${formData.banner.includes('?') ? '&' : '?'}v=${Date.now()}`;
                return (
                  <img
                    src={src}
                    key={src}
                    alt="Card banner"
                    className="w-full h-32 object-cover rounded border border-gray-200"
                  />
                );
              })()}
            </div>
          )}
          
          {/* Split Upload Area */}
          <div className="grid grid-cols-2 gap-2">
            {/* Left Half: File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Store the file for upload
                    handleInputChange('bannerFile', file);
                    
                    // Also create a preview URL
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
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mb-1">Upload from file</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
              </label>
            </div>

            {/* Right Half: Paste from Clipboard */}
            <div 
              onPaste={async (e) => {
                e.preventDefault();
                const items = e.clipboardData.items;
                
                for (let i = 0; i < items.length; i++) {
                  const item = items[i];
                  if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                      handleInputChange('bannerFile', file);
                      
                      // Create preview URL
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        handleInputChange('banner', event.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                    break;
                  }
                }
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.read().then(data => {
                    for (let i = 0; i < data.length; i++) {
                      const item = data[i];
                      if (item.types.includes('image/png') || item.types.includes('image/jpeg') || item.types.includes('image/gif')) {
                        item.getType('image/png').then(blob => {
                          const file = new File([blob], 'pasted-image.png', { type: blob.type });
                          handleInputChange('bannerFile', file);
                          
                          // Create preview URL
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleInputChange('banner', event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }).catch(() => {
                          // Try other image types
                          item.getType('image/jpeg').then(blob => {
                            const file = new File([blob], 'pasted-image.jpg', { type: blob.type });
                            handleInputChange('bannerFile', file);
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleInputChange('banner', event.target.result);
                            };
                            reader.readAsDataURL(file);
                          });
                        });
                        break;
                      }
                    }
                  });
                }
              }}
              tabIndex={0}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="text-gray-400 mb-2">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mb-1">Paste from clipboard</p>
              <p className="text-xs text-gray-500">Ctrl+V or Cmd+V</p>
            </div>
          </div>
          
          {/* Remove Banner Button */}
          {formData.banner && (
            <button
              onClick={() => {
                handleInputChange('banner', '');
                handleInputChange('bannerFile', null);
              }}
              className="mt-3 w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
            >
              Remove Banner Image
            </button>
          )}
        </div>

        {/* Reference Images */}
        <ImageReferenceSelector />
      </div>
    </div>
  );
};

export default CardTab; 