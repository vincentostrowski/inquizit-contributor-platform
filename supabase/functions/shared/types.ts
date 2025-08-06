// Shared types for Supabase Edge Functions

export interface GenerateCardsRequest {
  sectionId: number
  bookId: number
}

export interface ClaudeResponse {
  cards: Card[]
  references: CardReference[]
}

export interface Card {
  title: string
  description: string
  prompt: string
  order: number
  card_idea: string
  banner: string
}

export interface CardReference {
  card_id: number
  source_section_id: number
  source_snippet_id: number | null
  char_start: number
  char_end: number
}

export interface DatabaseCard {
  id: number
  title: string
  description: string
  prompt: string
  order: number
  card_idea: string
  banner: string
  book: number
  created_at: string
}

export interface DatabaseCardReference {
  id: number
  card_id: number
  source_section_id: number
  source_snippet_id: number | null
  char_start: number
  char_end: number
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
} 