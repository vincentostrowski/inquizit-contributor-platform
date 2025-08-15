import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useBook } from '../../../context/BookContext';

const ImageReferenceSelector = () => {
  const { currentBook } = useBook();
  const [referenceImages, setReferenceImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState(null);

  // Fetch reference images when book changes
  useEffect(() => {
    if (currentBook?.id) {
      fetchReferenceImages();
    }
  }, [currentBook?.id]);

  const fetchReferenceImages = async () => {
    if (!currentBook?.id) return;
    
    setImagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('image_assets')
        .select('*')
        .eq('book_id', currentBook.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReferenceImages(data || []);
    } catch (error) {
      console.error('Error fetching reference images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const copyImageToClipboard = async (storagePath) => {
    try {
      // Get the public URL from Supabase
      const imageUrl = supabase.storage
        .from('reference-art')
        .getPublicUrl(storagePath).data.publicUrl;
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create clipboard item
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });
      
      // Copy to clipboard
      await navigator.clipboard.write([clipboardItem]);
      
      return true;
    } catch (error) {
      console.error('Failed to copy image:', error);
      return false;
    }
  };

  const copyImageUrl = async (storagePath) => {
    try {
      const imageUrl = supabase.storage
        .from('reference-art')
        .getPublicUrl(storagePath).data.publicUrl;
      
      await navigator.clipboard.writeText(imageUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return false;
    }
  };

  const handleImageCopy = async (image) => {
    const success = await copyImageToClipboard(image.storage_path);
    
    if (success) {
      setCopiedImageId(image.id);
      setTimeout(() => setCopiedImageId(null), 2000);
    }
  };

  const handleUrlCopy = async (image) => {
    const success = await copyImageUrl(image.storage_path);
    
    if (success) {
      setCopiedImageId(image.id);
      setTimeout(() => setCopiedImageId(null), 2000);
    }
  };

  if (imagesLoading) {
    return (
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-medium mb-3">Reference Images</h4>
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (referenceImages.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-medium mb-3">Reference Images</h4>
        <p className="text-sm text-gray-500">No reference images available for this book.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <h4 className="font-medium mb-3">Reference Images</h4>
      
      <div className="flex flex-wrap gap-2">
        {referenceImages.map((image) => {
          const imageUrl = supabase.storage
            .from('reference-art')
            .getPublicUrl(image.storage_path).data.publicUrl;
          
          const isCopied = copiedImageId === image.id;
          
          return (
            <div key={image.id} className="relative group">
              {/* Image Thumbnail */}
              <div
                className={`w-16 h-16 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isCopied 
                    ? 'border-green-500 scale-105' 
                    : 'border-gray-200 hover:border-blue-300 hover:scale-105'
                }`}
                onClick={() => handleImageCopy(image)}
              >
                <img
                  src={imageUrl}
                  alt="Reference image"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    e.target.style.display = 'none';
                  }}
                />
                
                {/* Copy Overlay */}
                {isCopied && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xs font-medium">Copied!</span>
                  </div>
                )}
              </div>
              
              {/* URL Copy Button (shown on hover) */}
              <button
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUrlCopy(image);
                }}
                title="Copy URL"
              >
                🔗
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageReferenceSelector;
