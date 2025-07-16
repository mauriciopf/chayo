# Retrieval-Augmented Generation (RAG) System

## Overview

The Chayo AI system now includes a comprehensive Retrieval-Augmented Generation (RAG) system that allows the AI assistant to learn from uploaded documents and provide more accurate, contextually relevant responses.

## How It Works

### 1. Document Upload and Processing
- Users can upload PDF and TXT files through the chat interface
- Documents are automatically processed and chunked into ~1000 character segments
- Each chunk is embedded using OpenAI's text-embedding-ada-002 model
- Embeddings are stored in the `conversation_embeddings` table with metadata

### 2. Dynamic Context Retrieval
When a user asks a question:
1. The system generates an embedding for the user's query
2. Similar document chunks are retrieved using vector similarity search
3. Relevant conversation history is also retrieved
4. Both document and conversation context are included in the system prompt

### 3. Enhanced AI Responses
The AI receives:
- Base system prompt with business constraints
- Relevant document chunks (if any)
- Relevant conversation history (if any)
- Instructions for using the context

## Technical Implementation

### Database Schema
```sql
-- conversation_embeddings table stores all embeddings
CREATE TABLE conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  organization_id UUID REFERENCES organizations(id),
  conversation_segment TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  segment_type TEXT NOT NULL, -- 'conversation', 'document', 'faq', 'example'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Components

#### 1. Upload API (`/api/upload`)
- Accepts PDF and TXT files
- Extracts text content
- Chunks text into segments
- Generates embeddings
- Stores in database with metadata

#### 2. Enhanced Chat API (`/api/chat`)
- Uses `systemPromptService.getDynamicSystemPrompt()`
- Retrieves relevant document chunks
- Retrieves relevant conversation history
- Returns RAG usage information

#### 3. System Prompt Service
- `getRelevantDocumentChunks()`: Finds relevant document chunks
- `getDynamicSystemPrompt()`: Builds context-aware system prompts
- Includes instructions for using document context

#### 4. Embedding Service
- `searchSimilarConversations()`: Vector similarity search
- `generateEmbeddings()`: OpenAI embedding generation
- `storeConversationEmbeddings()`: Database storage

### UI Enhancements

#### Chat Interface
- File upload button in chat
- Visual indicator when RAG is used ("Using document knowledge")
- Progress indicators for uploads

#### Message Display
- ChatMessage component shows RAG usage
- Blue checkmark icon for RAG-enhanced responses

## Usage Examples

### Uploading Documents
1. Click the file upload button in chat
2. Select a PDF or TXT file
3. File is automatically processed and embedded
4. AI can now reference the document content

### Asking Questions
- "What are your customer service hours?" → AI references uploaded documents
- "Tell me about your pricing" → AI uses document knowledge
- "How do I get support?" → AI provides accurate information from documents

## Configuration

### Similarity Thresholds
- Document chunks: 0.6 (more permissive for broader context)
- Conversations: 0.7 (more strict for relevance)

### Context Limits
- Document chunks: 3 per query
- Conversation history: 3 per query
- Total system prompt: ~4000 characters

## Benefits

1. **Accuracy**: AI responses are based on actual business documents
2. **Consistency**: Information stays consistent with official documents
3. **Learning**: System improves as more documents are uploaded
4. **Context**: AI understands business-specific terminology and processes

## Future Enhancements

1. **Document Management**: UI to view and manage uploaded documents
2. **Chunk Optimization**: Dynamic chunk sizing based on content
3. **Multi-language Support**: Embeddings for different languages
4. **Document Versioning**: Track document updates and changes
5. **Analytics**: Track which documents are most referenced

## Testing

Use the test script to verify RAG functionality:
```bash
node scripts/test_rag_system.js
```

This will:
1. Create a test document
2. Upload it to the system
3. Test various queries
4. Verify RAG-enhanced responses 