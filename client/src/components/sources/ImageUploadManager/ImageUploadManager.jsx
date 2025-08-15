import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { uploadImage, supabase } from '../../../services/supabaseClient';

const ImageUploadManager = ({ sectionId, bookId }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch images when bookId changes
  useEffect(() => {
    if (bookId) {
      fetchImages();
    }
  }, [bookId]);

  const fetchImages = async () => {
    if (!bookId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('image_assets')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching images:', error);
        return;
      }
      
      console.log('📸 Fetched images:', data);
      setUploadedImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      console.log('🔄 Files selected:', files);
      handleImageUpload(files);
    }
  }, []);

  const handleImageUpload = async (files) => {
    if (!bookId) {
      console.error('❌ No bookId provided');
      return;
    }

    setIsUploading(true);
    console.log('🚀 Starting upload for book:', bookId);
    
    try {
      for (const file of files) {
        console.log('📁 Uploading file:', file.name, 'Size:', file.size);
        
        const result = await uploadImage(file, bookId);
        console.log('📤 Upload result:', result);
        
        if (result.success) {
          console.log('✅ Upload successful!');
          // Refresh the images list
          await fetchImages();
        } else {
          console.error('❌ Upload failed:', result.error);
        }
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload process complete');
    }
  };

  const handleDeleteImage = async (imageId, storagePath) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('reference-art')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('image_assets')
        .delete()
        .eq('id', imageId);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        return;
      }

      console.log('✅ Image deleted successfully');
      // Refresh the images list
      await fetchImages();
    } catch (error) {
      console.error('💥 Delete error:', error);
    }
  };

  const handleViewImage = (storagePath) => {
    const imageUrl = supabase.storage
      .from('reference-art')
      .getPublicUrl(storagePath).data.publicUrl;
    
    // Open in new tab
    window.open(imageUrl, '_blank');
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header with Upload Button */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Image References</h3>
            {isUploading && (
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #2563eb', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {uploadedImages.length} images
            </span>
            <label style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '4px 8px', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#374151', 
              backgroundColor: 'white', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}>
              <Icon icon="mdi:plus" style={{ width: '12px', height: '12px', marginRight: '4px' }} />
              Upload
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Image Row */}
      <div style={{ padding: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ color: '#9ca3af', marginBottom: '8px' }}>
              <Icon icon="mdi:loading" style={{ width: '32px', height: '32px', margin: '0 auto' }} />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading images...</p>
          </div>
        ) : uploadedImages.length > 0 ? (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {uploadedImages.map((image) => {
              // Generate the public URL from storage path
              const imageUrl = supabase.storage
                .from('reference-art')
                .getPublicUrl(image.storage_path).data.publicUrl;
              
              return (
                <div key={image.id} style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={imageUrl}
                    alt="Uploaded image"
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '6px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0)', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ 
                      opacity: 0, 
                      display: 'flex', 
                      gap: '4px',
                      transition: 'opacity 0.2s'
                    }}>
                      <button style={{ 
                        padding: '4px', 
                        backgroundColor: 'white', 
                        borderRadius: '4px', 
                        color: '#374151', 
                        border: 'none',
                        cursor: 'pointer'
                      }} onClick={() => handleViewImage(image.storage_path)}>
                        <Icon icon="mdi:eye" style={{ width: '12px', height: '12px' }} />
                      </button>
                      <button style={{ 
                        padding: '4px', 
                        backgroundColor: 'white', 
                        borderRadius: '4px', 
                        color: '#374151', 
                        border: 'none',
                        cursor: 'pointer'
                      }} onClick={() => handleDeleteImage(image.id, image.storage_path)}>
                        <Icon icon="mdi:delete" style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ color: '#9ca3af', marginBottom: '8px' }}>
              <Icon icon="mdi:image-outline" style={{ width: '32px', height: '32px', margin: '0 auto' }} />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No images uploaded yet</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Upload images to use as reference for card banners
            </p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Hover effects */
        div[style*="position: relative"]:hover > div[style*="position: absolute"] {
          background-color: rgba(0,0,0,0.4) !important;
        }
        
        div[style*="position: relative"]:hover > div[style*="position: absolute"] > div {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default ImageUploadManager;