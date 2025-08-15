import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Image upload function
export const uploadImage = async (file, bookId) => {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `book_${bookId}/image_${timestamp}.${fileExtension}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('reference-art')
      .upload(filename, file)
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reference-art')
      .getPublicUrl(filename)
    
    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('image_assets')
      .insert({
        book_id: bookId,
        storage_path: filename
      })
      .select()
      .single()
    
    if (dbError) {
      throw new Error(`Database save failed: ${dbError.message}`)
    }
    
    return {
      success: true,
      storagePath: filename,
      publicUrl: publicUrl,
      fileSize: file.size,
      mimeType: file.type,
      databaseId: dbData.id
    }
  } catch (error) {
    console.error('Image upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
