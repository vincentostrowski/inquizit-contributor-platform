import React, { useState } from 'react';
import { useBook } from '../context/BookContext';
import MobilePreview from '../components/ui/MobilePreview';
import { supabase } from '../services/supabaseClient';

const PublishPage = () => {
  const { currentBook } = useBook();
  // State for editable book fields (like CardEditModal)
  const [bookData, setBookData] = useState({
    title: '',
    description: '',
    cover: ''
  });
  
  // State for cover image handling (like CardEditModal)
  const [coverFile, setCoverFile] = useState(null);
  
  // State for save operations
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // State for color selection
  const [headerColor, setHeaderColor] = useState('#3B82F6'); // Default blue
  const [backgroundEndColor, setBackgroundEndColor] = useState('#1E40AF'); // Default darker blue
  const [buttonTextBorderColor, setButtonTextBorderColor] = useState('#6B7280'); // Default gray
  const [buttonCircleColor, setButtonCircleColor] = useState('#374151'); // Default darker gray
  
  // Initialize bookData when currentBook changes
  React.useEffect(() => {
    if (currentBook) {
      setBookData({
        title: currentBook.title || '',
        description: currentBook.description || '',
        cover: currentBook.cover || ''
      });
      
      // Initialize colors from database or use defaults
      setHeaderColor(currentBook.header_color || '#3B82F6');
      setBackgroundEndColor(currentBook.background_end_color || '#1E40AF');
      setButtonTextBorderColor(currentBook.button_text_border_color || '#6B7280');
      setButtonCircleColor(currentBook.button_circle_color || '#374151');
    }
  }, [currentBook]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setBookData(prev => ({ ...prev, cover: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = () => {
    document.getElementById('imageInput').click();
  };

  // Function to upload book cover to Supabase storage
  const uploadBookCover = async (file, bookId) => {
    const fileExt = (file.name?.split('.').pop() || 'png').toLowerCase();
    const path = `books/${bookId}/cover.${fileExt}`;

    const { error } = await supabase.storage
      .from('book-covers')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/png' });

    if (error) {
      console.error('Error uploading book cover:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!currentBook) return;
    
    setIsSaving(true);
    try {
      let coverUrl = bookData.cover;
      
      // Upload cover image if we have a new file
      if (coverFile) {
        coverUrl = await uploadBookCover(coverFile, currentBook.id);
      }
      
      // Update the books table
      const { error } = await supabase
        .from('books')
        .update({
          title: bookData.title,
          description: bookData.description,
          cover: coverUrl,
          header_color: headerColor,
          background_end_color: backgroundEndColor,
          button_text_border_color: buttonTextBorderColor,
          button_circle_color: buttonCircleColor
        })
        .eq('id', currentBook.id);
      
      if (error) {
        throw new Error(`Failed to update book: ${error.message}`);
      }
      
      console.log('Save successful!');
      
      // Clear the coverFile since it's now uploaded
      setCoverFile(null);
      
    } catch (error) {
      console.error('Save failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentBook) return;
    
    setIsPublishing(true);
    try {
      // First save the book data
      await handleSave();
      
      // Then update the status to published
      const { error } = await supabase
        .from('books')
        .update({ status: 'published' })
        .eq('id', currentBook.id);
      
      if (error) {
        throw new Error(`Failed to publish book: ${error.message}`);
      }
      
      console.log('Publish successful!');
      
    } catch (error) {
      console.error('Publish failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Half - Phone Preview */}
      <div className="w-1/2 border-r border-gray-200">
        <div className="h-full bg-gray-50 flex items-center justify-center p-8">
          <MobilePreview 
            bookData={bookData} 
            headerColor={headerColor}
            backgroundEndColor={backgroundEndColor}
            buttonTextBorderColor={buttonTextBorderColor}
            buttonCircleColor={buttonCircleColor}
          />
        </div>
      </div>

      {/* Right Half - Cover Image + Book Information + Publish Button */}
      <div className="w-1/2 bg-gray-50">
        <div className="h-full flex flex-col">
          {/* Book Information Sections - Scrollable (including cover image) */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
                            {/* Cover Image Section */}
              <div className="flex justify-center">
                                  {/* Image Preview */}
                  {bookData.cover && (
                    <div className="mb-3">
                      <img
                        src={bookData.cover}
                        alt="Book cover"
                        className="w-64 h-80 object-fill rounded border border-gray-200"
                      />
                    </div>
                  )}
                
                {/* Upload Area */}
                <div 
                  className="w-64 h-80 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer" 
                  onClick={handleImageChange}
                >
                  {bookData.cover ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-600">
                        Click to change cover image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        Click to upload cover image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Remove Cover Button */}
              {bookData.cover && (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setCoverFile(null);
                      setBookData(prev => ({ ...prev, cover: '' }));
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove cover image
                  </button>
                </div>
              )}
              
              {/* Color Selector Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Section Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Color Scheme</h3>
                </div>
                
                {/* Content Area - Gray background */}
                <div className="py-4 px-4 space-y-4">
                  {/* Header Color Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Header Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={headerColor}
                        onChange={(e) => setHeaderColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        title="Header Color"
                      />
                      <span className="text-sm text-gray-600 font-mono">{headerColor}</span>
                    </div>
                  </div>
                  
                  {/* Background End Color Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Background End Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={backgroundEndColor}
                        onChange={(e) => setBackgroundEndColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        title="Background End Color"
                      />
                      <span className="text-sm text-gray-600 font-mono">{backgroundEndColor}</span>
                      </div>
                  </div>
                  

                  
                  {/* Button Text & Border Color Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Button Text & Border Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={buttonTextBorderColor}
                        onChange={(e) => setButtonTextBorderColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        title="Button Text & Border Color"
                      />
                      <span className="text-sm text-gray-600 font-mono">{buttonTextBorderColor}</span>
                    </div>
                  </div>
                  
                  {/* Button Circle Color Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Button Circle Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={buttonCircleColor}
                        onChange={(e) => setButtonCircleColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        title="Button Circle Color"
                      />
                      <span className="text-sm text-gray-600 font-mono">{buttonCircleColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Section Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Title</h3>
                </div>
                
                {/* Content Area - Gray background */}
                <div className="py-4 px-4">
                  <div className="text-gray-700">
                    <input
                      type="text"
                      value={bookData.title}
                      onChange={(e) => setBookData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter book title"
                      className="w-full text-base bg-transparent border-none outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Authors Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Section Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Authors</h3>
                </div>
                
                {/* Content Area - Gray background */}
                <div className="py-4 px-4">
                  <div className="text-gray-700">
                    <p className="text-base">Author, Author, Authors</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Section Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Description</h3>
                </div>
                
                {/* Content Area - Gray background */}
                <div className="py-4 px-4">
                  <div className="text-gray-700 leading-relaxed">
                    <textarea
                      value={bookData.description}
                      onChange={(e) => setBookData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter book description"
                      className="w-full text-base bg-transparent border-none outline-none focus:ring-0 p-0 resize-none"
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Section Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Tags</h3>
                </div>
                
                {/* Content Area - Gray background */}
                <div className="py-4 px-4">
                  {/* Tag Placeholders */}
                  <div className="space-y-4">
                    {/* First row - 5 tags */}
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-28 h-8 bg-gray-100 rounded-md border border-gray-200"></div>
                      ))}
                    </div>
                    
                    {/* Second row - 4 tags */}
                    <div className="flex gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-28 h-8 bg-gray-100 rounded-md border border-gray-200"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save and Publish Buttons - Fixed at Bottom */}
          <div className="flex-none bg-white border-t border-gray-200 p-6">
            <div className="flex gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishPage;
