# Supabase Edge Functions

This directory contains modular edge functions for the contributor platform.

## 🏗️ Architecture

```
supabase/functions/
├── generate-cards/           # Main orchestration function
├── claude-api/              # Claude AI API wrapper
├── card-operations/         # Card CRUD operations
├── section-operations/      # Section-related operations
└── shared/                  # Shared utilities and types
    ├── types.ts            # TypeScript interfaces
    └── utils.ts            # Common utility functions
```

## 🚀 Functions Overview

### **generate-cards** (Main Orchestrator)
- **Purpose**: Main entry point for card generation
- **Input**: Section ID and book ID
- **Process**: 
  1. Fetches section data and snippets
  2. Identifies and deletes cards that only reference this section
  3. Creates content batches (max 95k chars each) to handle 100k limit
  4. Calls Claude API for each batch with existing cards context
  5. Combines and saves all generated cards to database
- **Output**: Success/error response with batch count

### **claude-api** (AI Integration)
- **Purpose**: Handles Claude API calls and prompt building
- **Input**: Section data (ID, title, content) + existing cards + batch info
- **Process**: 
  1. Builds Claude prompt from section data, existing cards, and batch context
  2. Calls Claude API (TODO: implement actual API call)
  3. Returns structured response
- **Output**: Cards and references data for current batch

### **card-operations** (Database Operations)
- **Purpose**: Handles card database operations
- **Input**: Claude response + book ID
- **Process**: 
  1. Saves cards to `cards` table
  2. Saves references to `card_source_references` table
- **Output**: Saved card data

### **section-operations** (Section Utilities)
- **Purpose**: Handles section-related operations
- **Input**: Section ID
- **Process**: 
  1. Fetches source snippets for section
  2. Returns ordered snippet data
- **Output**: Section snippets

### **shared** (Common Code)
- **types.ts**: TypeScript interfaces for all functions
- **utils.ts**: Common utility functions (CORS, responses, prompts)

## 📡 API Usage

### Generate Cards
```javascript
const { data, error } = await supabase.functions.invoke('generate-cards', {
  body: {
    sectionId: 123,
    bookId: 456
  }
})
```

### Claude API
```javascript
const { data, error } = await supabase.functions.invoke('claude-api', {
  body: {
    sectionId: 123,
    sectionTitle: "Introduction to React",
    sectionContent: "React is a JavaScript library...",
    existingCards: [], // Optional: existing cards to avoid duplicates
    batchNumber: 1, // Optional: current batch number
    totalBatches: 3 // Optional: total number of batches
  }
})
```

### Card Operations
```javascript
const { data, error } = await supabase.functions.invoke('card-operations', {
  body: {
    claudeResponse: { cards: [...], references: [...] },
    bookId: 456
  }
})
```

### Section Operations
```javascript
const { data, error } = await supabase.functions.invoke('section-operations', {
  body: {
    sectionId: 123
  }
})
```

## 🚀 Deployment

1. **Deploy all functions:**
   ```bash
   supabase functions deploy generate-cards
   supabase functions deploy claude-api
   supabase functions deploy card-operations
   supabase functions deploy section-operations
   ```

2. **Set environment variables:**
   ```bash
   supabase secrets set CLAUDE_API_KEY=your_claude_api_key_here
   ```

## 🔧 Development

### Benefits of Modular Structure
- **Separation of Concerns**: Each function has a single responsibility
- **Reusability**: Functions can be called independently
- **Maintainability**: Easier to debug and update individual components
- **Testing**: Each function can be tested in isolation
- **Scalability**: Functions can be optimized independently

### Future Enhancements
1. **Add actual Claude API integration** in `claude-api` function
2. **Add caching** for frequently accessed data
3. **Add rate limiting** for API calls
4. **Add validation** for Claude responses
5. **Add error recovery** mechanisms
6. **Add monitoring** and logging

## 🛡️ Security
- API keys stored securely in Supabase secrets
- Input validation on all functions
- Proper CORS headers configured
- No sensitive data exposed to client 