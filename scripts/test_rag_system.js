// Test script to verify RAG system functionality
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testRAGSystem() {
  console.log('🧪 Testing RAG System...\n')

  try {
    // 1. Check if conversation_embeddings table has data
    console.log('1. Checking conversation_embeddings table...')
    const { data: conversations, error: convError } = await supabase
      .from('conversation_embeddings')
      .select('*')
      .limit(5)

    if (convError) {
      console.error('❌ Error fetching conversations:', convError)
      return
    }

    console.log(`✅ Found ${conversations?.length || 0} conversation records`)
    
    if (conversations && conversations.length > 0) {
      console.log('Sample conversation:', conversations[0])
    }

    // 2. Check if embeddings are generated
    console.log('\n2. Checking for embeddings...')
    const { data: embeddings, error: embError } = await supabase
      .from('conversation_embeddings')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)

    if (embError) {
      console.error('❌ Error checking embeddings:', embError)
    } else {
      console.log(`✅ Found ${embeddings?.length || 0} records with embeddings`)
      if (embeddings && embeddings.length > 0) {
        console.log('✅ Embeddings are being generated')
      } else {
        console.log('⚠️  No embeddings found - this might be the issue')
      }
    }

    // 3. Test the search function
    console.log('\n3. Testing search function...')
    if (conversations && conversations.length > 0) {
      const testQuery = 'business'
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_similar_conversations', {
          query_embedding: new Array(1536).fill(0.1), // Dummy embedding
          agent_id_param: conversations[0].agent_id,
          match_threshold: 0.5,
          match_count: 3
        })

      if (searchError) {
        console.error('❌ Search function error:', searchError)
      } else {
        console.log(`✅ Search function working, found ${searchResults?.length || 0} results`)
      }
    }

    // 4. Check agents table
    console.log('\n4. Checking agents table...')
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id, name, business_constraints')
      .limit(3)

    if (agentError) {
      console.error('❌ Error fetching agents:', agentError)
    } else {
      console.log(`✅ Found ${agents?.length || 0} agents`)
      if (agents && agents.length > 0) {
        console.log('Sample agent:', {
          id: agents[0].id,
          name: agents[0].name,
          has_constraints: !!agents[0].business_constraints
        })
      }
    }

    console.log('\n🎯 RAG System Test Complete!')
    console.log('\n📋 Summary:')
    console.log('- Conversations stored:', conversations?.length || 0)
    console.log('- Embeddings generated:', embeddings?.length || 0)
    console.log('- Agents available:', agents?.length || 0)

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testRAGSystem() 