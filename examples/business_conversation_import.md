# Business Conversation Import System

This system allows you to import business conversations into your organizations to enhance their knowledge and responses.

## Database Migration

First, run the migration to set up the conversation embeddings table:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/conversation_embeddings_migration.sql
```

## API Endpoints

### Upload Business Conversations

**POST** `/api/organizations/{organizationId}/conversations`

```javascript
// Example: Upload business conversations
const response = await fetch('/api/organizations/your-organization-id/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    conversations: [
      {
        messages: [
          { role: 'user', content: 'What are your business hours?' },
          { role: 'assistant', content: 'We are open Monday to Friday, 9 AM to 6 PM.' }
        ]
      },
      {
        text: 'Our return policy allows 30-day returns with original receipt.',
        type: 'knowledge'
      },
      {
        text: 'How do I track my order?',
        type: 'faq'
      }
    ],
    format: 'json',
    updateSystemPrompt: true
  })
})

const result = await response.json()
console.log('Processed segments:', result.data.processedSegments)
```

### Search Conversations

**GET** `/api/organizations/{organizationId}/conversations?query=return policy&limit=5`

```javascript
// Example: Search for similar conversations
const response = await fetch('/api/organizations/your-organization-id/conversations?query=return policy&limit=5')
const result = await response.json()
console.log('Similar conversations:', result.data.conversations)
```

### Delete All Conversations

**DELETE** `/api/organizations/{organizationId}/conversations`

```javascript
// Example: Delete all conversation embeddings
const response = await fetch('/api/organizations/your-organization-id/conversations', {
  method: 'DELETE'
})
const result = await response.json()
console.log('Deleted:', result.message)
```

## Supported Formats

### 1. JSON Format (Default)

```json
[
  {
    "messages": [
      { "role": "user", "content": "Customer question here" },
      { "role": "assistant", "content": "Business response here" }
    ]
  },
  {
    "text": "Business knowledge or FAQ",
    "type": "knowledge"
  }
]
```

### 2. Simple Text Format

```json
[
  "First conversation segment",
  "Second conversation segment",
  "Business policy information"
]
```

### 3. CSV Format

```csv
text,type,metadata
"What are your hours?",faq,"{""category"": ""hours""}"
"We offer 30-day returns",knowledge,"{""category"": ""policies""}"
```

## Segment Types

- **conversation**: Regular customer interactions
- **faq**: Frequently asked questions
- **knowledge**: Business policies, procedures, information
- **example**: Example interactions to follow

## System Prompt Generation

The system automatically generates comprehensive system prompts that include:

1. **Business Constraints**: Name, tone, industry, values
2. **Conversation Knowledge**: Patterns from previous interactions
3. **FAQs**: Common questions and answers
4. **Examples**: Sample interactions to follow
5. **Response Guidelines**: How to represent the business

## Example Business Data

```javascript
// Example business conversation data
const businessConversations = [
  // Customer support conversations
  {
    messages: [
      { role: 'user', content: 'I need help with my order #12345' },
      { role: 'assistant', content: 'I can help you track your order. Let me check the status for you.' }
    ]
  },
  
  // Business policies
  {
    text: 'We offer free shipping on orders over $50',
    type: 'knowledge',
    metadata: { category: 'shipping' }
  },
  
  // FAQs
  {
    text: 'What payment methods do you accept?',
    type: 'faq'
  },
  
  // Example interactions
  {
    text: 'Customer: "I have a complaint" | Assistant: "I\'m sorry to hear that. Let me help resolve this for you."',
    type: 'example'
  }
]
```

## Integration with AI Responses

The system integrates with your AI response generation by:

1. **Dynamic System Prompts**: Generate context-aware prompts for each query
2. **Similarity Search**: Find relevant past conversations
3. **Knowledge Retrieval**: Include business-specific information in responses

```javascript
// Example: Get dynamic system prompt for a query
import { systemPromptService } from '@/lib/services/systemPromptService'

const systemPrompt = await systemPromptService.getDynamicSystemPrompt(
  agentId,
  userQuery,
  {
    includeConversations: true,
    includeFaqs: true,
    includeExamples: true,
    maxContextLength: 4000,
    temperature: 0.7
  }
)

// Use this system prompt with your AI model
const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery }
  ]
})
```

## Benefits

1. **Knowledge Retention**: All business conversations are preserved and searchable
2. **Consistent Responses**: AI learns from past interactions
3. **Business Intelligence**: Extract patterns and insights from conversations
4. **Scalable**: Handle large volumes of business data
5. **Secure**: Row-level security ensures data privacy

## Next Steps

1. Run the database migration
2. Install OpenAI package: `npm install openai`
3. Set up your OpenAI API key in environment variables
4. Start uploading your business conversations
5. Test the system prompt generation
6. Integrate with your AI response system 