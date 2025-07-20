# 🧠 Writable Memory Update System

## Overview

The Chayo AI system now includes a comprehensive **Writable Memory Update System** that allows business information to be updated dynamically with intelligent conflict detection and resolution. This system ensures that the AI's knowledge base stays current and accurate as business information changes.

## 🌟 Key Features

### ✅ **Core Capabilities**
- **Memory Updates**: Update existing business knowledge with new information
- **Conflict Detection**: Automatically identify conflicting information
- **Intelligent Merging**: AI-powered conflict resolution and memory merging
- **Automatic Extraction**: Extract memory updates from chat conversations
- **Similarity Search**: Find related memories using semantic search
- **Memory Management**: Full CRUD operations on business memories

### ✅ **Conflict Resolution Strategies**
- **Auto-Merge**: Combine complementary information intelligently
- **Replace**: Newer information supersedes older data
- **Keep Both**: Maintain separate but related memories
- **Reject**: Prevent duplicate or incorrect information

---

## 🔧 Technical Implementation

### **Enhanced EmbeddingService**

#### **1. Update Memory**
```typescript
const result = await embeddingService.updateMemory(agentId, {
  text: "Our business hours are now Monday-Friday 8 AM to 7 PM",
  type: "knowledge",
  reason: "Updated operating hours",
  confidence: 0.95
}, 'auto')

// Result includes:
// - success: boolean
// - action: 'created' | 'merged' | 'replaced' | 'rejected'
// - memoryId: string
// - conflicts?: EmbeddingResult[]
// - resolution?: ConflictResolution
```

#### **2. Detect Conflicts**
```typescript
const conflicts = await embeddingService.getMemoryConflicts(agentId, 0.85)

// Returns:
// - conflicts: Array of conflicting memory groups
// - totalConflicts: number
// - Each conflict includes similarity score and topic
```

#### **3. Memory Management**
```typescript
// Delete specific memory
await embeddingService.deleteMemory(agentId, memoryId)

// Update specific memory by ID
await embeddingService.updateMemory(agentId, {
  id: memoryId,
  text: "Updated information",
  type: "knowledge"
})
```

---

## 📡 API Endpoints

### **1. Memory Updates (PATCH)**
```bash
PATCH /api/agents/{agentId}/conversations
Content-Type: application/json

{
  "memoryUpdate": {
    "text": "Business hours changed to 9 AM - 6 PM weekdays",
    "type": "knowledge",
    "reason": "Updated operating schedule",
    "confidence": 0.9
  },
  "conflictStrategy": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "merged",
    "memoryId": "uuid-here",
    "conflicts": [...],
    "resolution": {
      "action": "merge",
      "confidence": 0.95,
      "reason": "Combined hours and contact info",
      "merged_text": "Updated business info..."
    },
    "knowledgeSummary": {...}
  }
}
```

### **2. Conflict Detection (GET)**
```bash
GET /api/agents/{agentId}/memory?action=conflicts&threshold=0.85
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "group": [
          {
            "id": "uuid1",
            "conversation_segment": "We're open 9-5 Mon-Fri",
            "distance": 0.12
          },
          {
            "id": "uuid2", 
            "conversation_segment": "Business hours: 8 AM to 6 PM daily",
            "distance": 0.15
          }
        ],
        "similarity": 0.88,
        "topic": "business hours operating"
      }
    ],
    "totalConflicts": 1,
    "threshold": 0.85
  }
}
```

### **3. Memory Deletion (DELETE)**
```bash
DELETE /api/agents/{agentId}/memory
Content-Type: application/json

{
  "memoryId": "uuid-to-delete"
}
```

---

## 🤖 Automatic Memory Updates

### **Chat Integration**
The system automatically detects memory updates during conversations:

```typescript
// Triggers automatic memory update detection
const memoryUpdateKeywords = [
  'business hours changed', 'updated hours', 'new hours',
  'moved location', 'new address', 'relocated', 
  'changed phone', 'new phone', 'updated contact',
  'price change', 'updated pricing', 'new rates',
  'service change', 'new service', 'updated service',
  'policy change', 'updated policy', 'new policy'
]
```

**Example Conversation:**
```
User: "Our business hours changed to 9 AM - 7 PM Monday through Saturday"
AI: "I've updated your business hours information. Would you like me to..."

// System automatically:
// 1. Detects "business hours changed" keyword
// 2. Extracts new hours using AI
// 3. Finds similar existing memories
// 4. Resolves conflicts (merge/replace/keep both)
// 5. Updates the knowledge base
```

---

## 🧠 AI-Powered Conflict Resolution

### **Resolution Process**
1. **Similarity Detection**: Find memories with >85% similarity
2. **AI Analysis**: GPT-4 analyzes conflicts and determines best action
3. **Intelligent Merging**: Combine information when appropriate
4. **Embedding Update**: Regenerate embeddings for updated content

### **Example Conflict Resolution**
```
EXISTING MEMORY: "We're open Monday-Friday 9 AM to 5 PM"
NEW MEMORY: "Business hours updated to 9 AM - 6 PM weekdays"

AI RESOLUTION:
{
  "action": "merge",
  "confidence": 0.95,
  "reason": "New hours extend existing schedule - merge for completeness",
  "merged_text": "Business hours: Monday-Friday 9 AM to 6 PM (updated schedule)"
}
```

---

## 📊 Memory Analytics

### **Knowledge Summary**
```typescript
const summary = await embeddingService.getBusinessKnowledgeSummary(agentId)

// Returns:
// - conversation_count: Number of conversation memories
// - knowledge_count: Number of business knowledge items  
// - faq_count: Number of FAQ entries
// - document_count: Number of document segments
// - total_segments: Total memory items
```

### **Conflict Monitoring**
- Monitor memory conflicts in real-time
- Track resolution success rates
- Identify frequently updated business information
- Measure knowledge base growth and accuracy

---

## 🔄 Usage Examples

### **Example 1: Business Hours Update**
```javascript
// User says: "We changed our hours to 8 AM - 9 PM daily"
const result = await embeddingService.updateMemory(agentId, {
  text: "Business hours: 8 AM - 9 PM daily (extended hours)",
  type: "knowledge",
  reason: "Extended operating hours",
  confidence: 0.95
})

console.log(result.action) // "merged" or "replaced"
```

### **Example 2: Location Change**
```javascript
// User says: "We moved to 123 New Street, Downtown"
const result = await embeddingService.updateMemory(agentId, {
  text: "New location: 123 New Street, Downtown - fully relocated",
  type: "knowledge", 
  reason: "Business relocation",
  confidence: 1.0
})

// System finds old address and replaces it
```

### **Example 3: Service Updates**
```javascript
// User says: "We now offer 24/7 customer support"
const result = await embeddingService.updateMemory(agentId, {
  text: "24/7 customer support now available",
  type: "knowledge",
  reason: "Expanded support services", 
  confidence: 0.9
})

// System merges with existing service information
```

---

## ⚡ Performance & Scalability

### **Optimizations**
- **Vector Indexes**: HNSW indexes for fast similarity search
- **Batch Processing**: Update multiple memories efficiently
- **Caching**: Cache frequently accessed memories
- **Threshold Tuning**: Adjustable similarity thresholds

### **Monitoring**
- **Update Frequency**: Track how often memories are updated
- **Conflict Rates**: Monitor conflict detection accuracy
- **Resolution Success**: Measure automatic resolution effectiveness
- **Knowledge Growth**: Track knowledge base expansion

---

## 🛡️ Data Integrity

### **Safeguards**
- **Confidence Scoring**: Weight updates by confidence levels
- **User Verification**: Optional manual conflict resolution
- **Audit Trail**: Track all memory changes with metadata
- **Rollback Capability**: Restore previous memory states

### **Security**
- **Row-Level Security**: Users can only update their own memories
- **Authentication**: All updates require valid user authentication
- **Rate Limiting**: Prevent excessive memory updates
- **Input Validation**: Sanitize and validate all memory updates

---

## 🚀 Future Enhancements

### **Planned Features**
- **Memory Versioning**: Track memory change history
- **Bulk Memory Import**: Import large knowledge bases
- **Smart Suggestions**: AI-suggested memory improvements
- **Cross-Agent Learning**: Share knowledge between related agents
- **Real-time Sync**: Live memory updates across all channels

---

This writable memory system transforms static knowledge bases into dynamic, self-updating business intelligence that grows and improves with each interaction. 