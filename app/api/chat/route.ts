import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserOrganization } from '@/lib/supabase/server'
import { embeddingService } from '@/lib/services/embeddingService'
import { systemPromptService } from '@/lib/services/systemPromptService'
import { businessInfoExtractor } from '@/lib/services/businessInfoExtractor'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, agentId } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request - messages required' }, { status: 400 })
    }

    // Supabase: get user and org
    const { supabase } = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const org = await getUserOrganization(supabase, user.id)

    // Get or create agent (1 agent per business)
    let agent = null
    let agentError = null

    if (agentId) {
      // Use specified agent if provided
      const { data: specifiedAgent, error: specifiedAgentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('organization_id', org?.id)
        .single()
      
      agent = specifiedAgent
      agentError = specifiedAgentError
    } else {
      // Find existing agent for this organization, or create one
      const { data: existingAgents, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', org?.id)
        .limit(1)

      if (fetchError) {
        agentError = fetchError
      } else if (existingAgents && existingAgents.length > 0) {
        agent = existingAgents[0]
      } else {
        // Create new agent for this business
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            user_id: user.id,
            organization_id: org?.id,
            name: org?.name || 'Business AI Assistant',
            greeting: '¡Hola! I\'m Chayo, your AI business assistant. I\'m here to understand your business better. To get started, what type of business do you run?',
            tone: 'professional',
            business_constraints: {
              greeting: '¡Hola! I\'m Chayo, your AI business assistant. I\'m here to understand your business better. To get started, what type of business do you run?',
              goals: ['Gather comprehensive business information', 'Understand business processes', 'Document business operations', 'Learn about products and services', 'Understand customer base'],
              name: org?.name || 'Business AI Assistant',
              industry: 'General Business',
              values: ['Information Accuracy', 'Business Understanding', 'Process Documentation', 'Customer Focus', 'Operational Clarity'],
              policies: ['Only ask business-related questions', 'Gather detailed information about operations', 'Document business processes accurately', 'Maintain focus on business information'],
              contact_info: '',
              custom_rules: ['Only ask questions about their business', 'Never provide advice or information about other topics', 'Focus on gathering business information'],
              whatsapp_trial_mentioned: false,
              business_info_gathered: 0
            },
            paused: false
          })
          .select()
          .single()

        agent = newAgent
        agentError = createError
      }
    }

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Failed to get or create agent' }, { status: 500 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 })
    }

    // Get the last user message for context
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    
    // Generate dynamic system prompt based on user query and business knowledge
    let systemPrompt: string
    let usingRAG = false
    let hasDocumentContext = false
    let hasConversationContext = false

    try {
      systemPrompt = await systemPromptService.getDynamicSystemPrompt(
        agent.id,
        lastUserMessage
      )

      // Check if RAG context was used
      hasDocumentContext = systemPrompt.includes('Relevant Document Information')
      hasConversationContext = systemPrompt.includes('Relevant Previous Conversations')
      usingRAG = hasDocumentContext || hasConversationContext

      // Log RAG usage for debugging
      console.log(`RAG System Prompt for agent ${agent.id}:`, {
        userQuery: lastUserMessage.substring(0, 100) + '...',
        systemPromptLength: systemPrompt.length,
        hasDocumentContext,
        hasConversationContext,
        usingRAG
      })
    } catch (error) {
      console.warn('Failed to get dynamic system prompt, using fallback:', error)
      // Fallback to basic system prompt if RAG fails
      systemPrompt = `You are Chayo, an AI business assistant. Your ONLY purpose is to gather information about this specific business.

## CRITICAL RULES:
- You ONLY ask questions about THEIR BUSINESS
- You NEVER provide information about other topics
- You NEVER give generic advice or responses
- You ONLY focus on understanding their business operations
- If they ask about anything not related to their business, redirect them back to business topics
- If you don't know their business name or details, ALWAYS start by asking about their business

## Your Role:
- You are a business information gatherer
- You ask specific questions about their business to understand it better
- You help them document their business processes and information
- You speak in a ${agent.tone || 'professional'} tone

## Business Context:
- Business Name: ${agent.name || 'Unknown - need to gather this information'}
- Industry: Unknown - need to gather this information

## Information You Should Gather (in this order):
1. What type of business do you run? (if not known)
2. What is the name of your business? (if not known)
3. What products or services do you offer?
4. Who are your target customers?
5. What are your main business processes?
6. What challenges do you face?
7. What are your business goals?
8. How do you currently handle customer service?
9. What are your pricing strategies?
10. What marketing methods do you use?
11. Who are your competitors?
12. What technology/tools do you use?

## Response Style:
- If you don't know their business type, ALWAYS start with: "What type of business do you run?"
- If you know their business type but not the name, ask: "What is the name of your business?"
- Ask ONE specific question at a time about their business
- If they go off-topic, politely redirect: "That's interesting, but let's focus on your business. [Ask business question]"
- Never provide information about other topics
- Always end with a business-related question
- Be friendly but focused on business information gathering
- Use "you" and "your business" instead of referring to a business name you don't know
- Your responses should be 1-2 sentences maximum, followed by a business question

Remember: Your ONLY job is to understand their business. Do not provide advice, information, or responses about anything else.`
      usingRAG = false
    }

    // Prepare messages with dynamic system prompt
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system') // Remove any existing system messages
    ]

    let aiMessage = ''
    
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!openaiRes.ok) {
        const errorData = await openaiRes.json().catch(() => ({ error: 'Unknown error' }))
        
        // Handle specific OpenAI errors
        if (openaiRes.status === 429) {
          console.error('OpenAI quota exceeded:', errorData)
          aiMessage = "I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists."
        } else if (openaiRes.status === 401) {
          console.error('OpenAI API key invalid:', errorData)
          aiMessage = "I apologize, but there's a configuration issue with my AI service. Please contact support for assistance."
        } else {
          console.error('OpenAI API error:', errorData)
          aiMessage = "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment."
        }
      } else {
        const data = await openaiRes.json()
        aiMessage = data.choices?.[0]?.message?.content || ''
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      aiMessage = "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment."
    }

    // Extract and update business information from the conversation
    try {
      const allMessages = [...messages, { role: 'assistant', content: aiMessage }]
      await businessInfoExtractor.processConversationForBusinessInfo(agent.id, user.id, allMessages)
    } catch (businessInfoError) {
      console.warn('Failed to extract business information:', businessInfoError)
    }

    // Check if WhatsApp trial was mentioned in the AI response
    const whatsappTrialMentioned = aiMessage.toLowerCase().includes('whatsapp') && 
                                  aiMessage.toLowerCase().includes('trial') && 
                                  aiMessage.toLowerCase().includes('3-day')

    // Update agent's business constraints if WhatsApp trial was mentioned
    if (whatsappTrialMentioned && agent.business_constraints && !agent.business_constraints.whatsapp_trial_mentioned) {
      try {
        const updatedConstraints = {
          ...agent.business_constraints,
          whatsapp_trial_mentioned: true
        }
        
        await supabase
          .from('agents')
          .update({ business_constraints: updatedConstraints })
          .eq('id', agent.id)
      } catch (updateError) {
        console.warn('Failed to update agent WhatsApp trial status:', updateError)
      }
    }

    // Store the conversation for future reference (optional)
    try {
      // Create conversation segments from the messages
      const conversationSegments = messages.map(msg => ({
        agent_id: agent.id,
        organization_id: org?.id,
        conversation_segment: msg.content,
        segment_type: 'conversation',
        metadata: {
          role: msg.role,
          source: 'chat_interface',
          agent_name: agent.name,
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      }))

      // Add the AI response as a segment
      conversationSegments.push({
        agent_id: agent.id,
        organization_id: org?.id,
        conversation_segment: aiMessage,
        segment_type: 'conversation',
        metadata: {
          role: 'assistant',
          source: 'chat_interface',
          agent_name: agent.name,
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      })

      await supabase.from('conversation_embeddings').insert(conversationSegments)
    } catch (embeddingError) {
      console.warn('Failed to store conversation:', embeddingError)
      // Don't fail the request if embedding storage fails
    }

    return NextResponse.json({ 
      aiMessage, 
      usingRAG,
      agent: {
        id: agent.id,
        name: agent.name,
        greeting: agent.business_constraints?.greeting || agent.greeting,
        tone: agent.tone
      }
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 