import { supabase } from './supabaseClient';

export const sectionService = {
  // Fetch all sections for a book
  async fetchSections(bookId) {
    const { data, error } = await supabase
      .from('source_sections')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create a new section
  async createSection(sectionData) {
    const { data, error } = await supabase
      .from('source_sections')
      .insert(sectionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update an existing section
  async updateSection(sectionId, updates) {
    const { data, error } = await supabase
      .from('source_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a section
  async deleteSection(sectionId) {
    const { error } = await supabase
      .from('source_sections')
      .delete()
      .eq('id', sectionId);
    
    if (error) throw error;
    return true;
  },

  // Get section by ID
  async getSection(sectionId) {
    const { data, error } = await supabase
      .from('source_sections')
      .select('*')
      .eq('id', sectionId)
      .single();
    
    if (error) throw error;
    return data;
  }
}; 