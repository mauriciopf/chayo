const { createClient } = require('@supabase/supabase-js')

// Test the new organization-based conversations API
async function testOrganizationConversations() {
  console.log('🧪 Testing Organization Conversations API...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 1. Get a test user and organization
    console.log('1. Getting test user and organization...')
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError)
      return
    }

    const testUser = users[0]
    console.log('✅ Test user:', { id: testUser.id, email: testUser.email })

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id, organizations(name)')
      .eq('user_id', testUser.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      console.error('❌ No organization membership found:', membershipError)
      return
    }

    const organizationId = membership.organization_id
    console.log('✅ Organization:', { id: organizationId, name: membership.organizations.name })

    // 2. Test POST - Store conversations
    console.log('\n2. Testing POST - Store conversations...')
    const testConversations = [
      {
        messages: [
          { role: 'user', content: 'What are your business hours?' },
          { role: 'assistant', content: 'We are open Monday to Friday, 9 AM to 6 PM.' }
        ]
      },
      {
        text: 'Our return policy allows 30-day returns with original receipt.',
        type: 'knowledge'
      }
    ]

    const postResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/organizations/${organizationId}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        conversations: testConversations,
        format: 'json'
      })
    })

    if (postResponse.ok) {
      const postResult = await postResponse.json()
      console.log('✅ POST successful:', postResult.data)
    } else {
      console.error('❌ POST failed:', await postResponse.text())
    }

    // 3. Test GET - Search conversations
    console.log('\n3. Testing GET - Search conversations...')
    const getResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/organizations/${organizationId}/conversations?query=business hours&limit=5`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })

    if (getResponse.ok) {
      const getResult = await getResponse.json()
      console.log('✅ GET successful:', {
        totalResults: getResult.data.totalResults,
        hasSummary: !!getResult.data.knowledgeSummary
      })
    } else {
      console.error('❌ GET failed:', await getResponse.text())
    }

    // 4. Test PATCH - Update memory
    console.log('\n4. Testing PATCH - Update memory...')
    const patchResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/organizations/${organizationId}/conversations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        memoryUpdate: {
          text: 'We are now open on Saturdays from 10 AM to 4 PM.',
          type: 'business_hours',
          metadata: {
            source: 'manual_update',
            updated_by: testUser.id
          }
        },
        conflictStrategy: 'auto'
      })
    })

    if (patchResponse.ok) {
      const patchResult = await patchResponse.json()
      console.log('✅ PATCH successful:', patchResult.data)
    } else {
      console.error('❌ PATCH failed:', await patchResponse.text())
    }

    // 5. Check database directly
    console.log('\n5. Checking database directly...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('conversation_embeddings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (embeddingsError) {
      console.error('❌ Database check failed:', embeddingsError)
    } else {
      console.log(`✅ Found ${embeddings?.length || 0} conversation embeddings in database`)
      if (embeddings && embeddings.length > 0) {
        console.log('Sample embedding:', {
          id: embeddings[0].id,
          segment_type: embeddings[0].segment_type,
          has_embedding: !!embeddings[0].embedding,
          created_at: embeddings[0].created_at
        })
      }
    }

    console.log('\n🎯 Organization Conversations API Test Complete!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testOrganizationConversations() 