// Shared types for Supabase Edge Functions

export interface GenerateCardsRequest {
  sectionId: number
  bookId: number
}

export interface CardGenerationResponse {
  cards: Card[]
  snippetChunks?: SnippetChunkForContext[]
  conversationLink?: string
}

export interface Card {
  title: string
  description: string
  prompt: string
  content: string
  order: number
  card_idea: string
  banner: string
}

export interface SnippetChunkForContext {
  card_id: number
  source_section_id: number
  source_snippet_id: number | null
  link: string | null
}

export interface DatabaseCard {
  id: number
  title: string
  description: string
  prompt: string
  content: string
  order: number
  card_idea: string
  banner: string
  book: number
  created_at: string
}

export interface DatabaseSnippetChunkForContext {
  id: number
  card_id: number
  source_section_id: number
  source_snippet_id: number | null
  link: string | null
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
} 