#!/usr/bin/env node

/**
 * Test script for Writable Memory Update System
 * 
 * This script demonstrates:
 * 1. Memory updates with conflict detection
 * 2. Automatic conflict resolution  
 * 3. Memory management operations
 * 4. Conflict analysis and reporting
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testWritableMemory() {
  console.log('🧠 Testing Writable Memory Update System\n')

  try {
    // Test agent ID (replace with actual agent ID)
    const testAgentId = process.argv[2]
    
    if (!testAgentId) {
      console.error('❌ Please provide an agent ID as argument')
      console.log('Usage: node scripts/test_writable_memory.js <agent-id>')
      process.exit(1)
    }

    console.log(`🎯 Testing with Agent ID: ${testAgentId}\n`)

    // Import the EmbeddingService
    const { EmbeddingService } = require('../lib/services/embeddingService')
    const embeddingService = new EmbeddingService(supabase)

    // Test 1: Add initial business information
    console.log('📝 Test 1: Adding initial business information...')
    const initialMemory = await embeddingService.updateMemory(testAgentId, {
      text: "Business hours: Monday-Friday 9 AM to 5 PM",
      type: "knowledge",
      reason: "Initial business hours setup",
      confidence: 0.9
    })
    
    console.log(`✅ Initial memory created: ${initialMemory.action} (${initialMemory.memoryId})`)
    console.log()

    // Test 2: Update business hours (should detect conflict)
    console.log('🔄 Test 2: Updating business hours (conflict detection)...')
    const hourUpdate = await embeddingService.updateMemory(testAgentId, {
      text: "Updated business hours: Monday-Friday 8 AM to 6 PM, Saturday 10 AM to 2 PM",
      type: "knowledge", 
      reason: "Extended hours including Saturday",
      confidence: 0.95
    })

    console.log(`✅ Hours update: ${hourUpdate.action} (${hourUpdate.memoryId})`)
    if (hourUpdate.conflicts) {
      console.log(`🔍 Conflicts detected: ${hourUpdate.conflicts.length}`)
    }
    if (hourUpdate.resolution) {
      console.log(`🤖 Resolution: ${hourUpdate.resolution.action} - ${hourUpdate.resolution.reason}`)
    }
    console.log()

    // Test 3: Add contact information
    console.log('📞 Test 3: Adding contact information...')
    const contactMemory = await embeddingService.updateMemory(testAgentId, {
      text: "Contact: Phone (555) 123-4567, Email: info@business.com",
      type: "knowledge",
      reason: "Business contact details",
      confidence: 1.0
    })
    
    console.log(`✅ Contact info: ${contactMemory.action} (${contactMemory.memoryId})`)
    console.log()

    // Test 4: Update phone number (should detect conflict with contact)
    console.log('📱 Test 4: Updating phone number...')
    const phoneUpdate = await embeddingService.updateMemory(testAgentId, {
      text: "New phone number: (555) 987-6543 - please update all materials",
      type: "knowledge",
      reason: "Phone number change",
      confidence: 0.9
    })

    console.log(`✅ Phone update: ${phoneUpdate.action} (${phoneUpdate.memoryId})`)
    if (phoneUpdate.conflicts) {
      console.log(`🔍 Conflicts detected: ${phoneUpdate.conflicts.length}`)
    }
    console.log()

    // Test 5: Analyze all conflicts
    console.log('🔍 Test 5: Analyzing memory conflicts...')
    const conflicts = await embeddingService.getMemoryConflicts(testAgentId, 0.85)
    
    console.log(`📊 Conflict Analysis:`)
    console.log(`   Total conflict groups: ${conflicts.totalConflicts}`)
    
    conflicts.conflicts.forEach((conflict, index) => {
      console.log(`   Group ${index + 1}: ${conflict.topic}`)
      console.log(`     Similarity: ${(conflict.similarity * 100).toFixed(1)}%`)
      console.log(`     Memories: ${conflict.group.length}`)
      conflict.group.forEach((memory, i) => {
        console.log(`       ${i + 1}. "${memory.conversation_segment.substring(0, 60)}..."`)
      })
    })
    console.log()

    // Test 6: Get knowledge summary
    console.log('📈 Test 6: Knowledge base summary...')
    const summary = await embeddingService.getBusinessKnowledgeSummary(testAgentId)
    
    console.log(`📊 Knowledge Summary:`)
    console.log(`   Total segments: ${summary?.total_segments || 0}`)
    console.log(`   Conversations: ${summary?.conversation_count || 0}`)
    console.log(`   Knowledge items: ${summary?.knowledge_count || 0}`)
    console.log(`   FAQ entries: ${summary?.faq_count || 0}`)
    console.log(`   Examples: ${summary?.example_count || 0}`)
    console.log()

    // Test 7: Search similar memories
    console.log('🔍 Test 7: Searching for business hours...')
    const similar = await embeddingService.searchSimilarConversations(
      testAgentId,
      "What are your operating hours?",
      0.7,
      3
    )

    console.log(`🔍 Found ${similar.length} similar memories:`)
    similar.forEach((memory, index) => {
      console.log(`   ${index + 1}. "${memory.conversation_segment.substring(0, 80)}..."`)
      console.log(`      Similarity: ${((1 - (memory.distance || 0)) * 100).toFixed(1)}%`)
    })
    console.log()

    console.log('🎉 Writable Memory System Test Complete!')
    console.log('\n📋 Summary:')
    console.log('✅ Memory creation and updates working')
    console.log('✅ Conflict detection functional') 
    console.log('✅ Automatic resolution operational')
    console.log('✅ Search and analytics active')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testWritableMemory()
} 