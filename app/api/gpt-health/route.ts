import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define available functions that GPT can call
const availableFunctions = {
  register_organization: {
    name: 'register_organization',
    description: 'Register a new health clinic or provider organization',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the health clinic or provider'
        },
        type: {
          type: 'string',
          description: 'Type of health provider (e.g., clinic, hospital, private practice)'
        },
        specialties: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of medical specialties offered'
        }
      },
      required: ['name', 'type']
    }
  },
  create_agent: {
    name: 'create_agent',
    description: 'Create a new health assistant agent for an organization',
    parameters: {
      type: 'object',
      properties: {
        organization_id: {
          type: 'string',
          description: 'ID of the organization this agent belongs to'
        },
        name: {
          type: 'string',
          description: 'Name of the health assistant agent'
        },
        role: {
          type: 'string',
          description: 'Role of the agent (e.g., receptionist, nurse, doctor assistant)'
        }
      },
      required: ['organization_id', 'name', 'role']
    }
  },
  get_health_info: {
    name: 'get_health_info',
    description: 'Get health information or answer medical questions',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The health-related question or information request'
        },
        context: {
          type: 'string',
          description: 'Additional context about the patient or situation'
        }
      },
      required: ['query']
    }
  },
  schedule_appointment: {
    name: 'schedule_appointment',
    description: 'Schedule a medical appointment',
    parameters: {
      type: 'object',
      properties: {
        patient_name: {
          type: 'string',
          description: 'Name of the patient'
        },
        appointment_type: {
          type: 'string',
          description: 'Type of appointment (e.g., consultation, checkup, procedure)'
        },
        preferred_date: {
          type: 'string',
          description: 'Preferred date for the appointment (YYYY-MM-DD)'
        },
        preferred_time: {
          type: 'string',
          description: 'Preferred time for the appointment (HH:MM)'
        },
        reason: {
          type: 'string',
          description: 'Reason for the appointment'
        }
      },
      required: ['patient_name', 'appointment_type', 'preferred_date', 'preferred_time']
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createClient(req)
    const body = await req.json()
    const { messages, user_id } = body

    // Create the system message for the health assistant
    const systemMessage = {
      role: 'system' as const,
      content: `You are Chayo, a helpful health assistant. You help patients and healthcare providers with various tasks including:

1. Registering new health clinics and providers
2. Creating health assistant agents for organizations
3. Answering health-related questions and providing medical information
4. Scheduling appointments
5. Providing general health guidance

You can call functions to perform specific tasks. Always be professional, empathetic, and prioritize patient safety. For medical advice, always recommend consulting with healthcare professionals.

Available functions:
- register_organization: Register a new health clinic or provider
- create_agent: Create a health assistant agent for an organization
- get_health_info: Get health information or answer medical questions
- schedule_appointment: Schedule a medical appointment

Use these functions when appropriate to help users with their health-related needs.`
    }

    // Prepare messages for GPT
    const gptMessages = [systemMessage, ...messages]

    // Call GPT with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: gptMessages,
      functions: Object.values(availableFunctions),
      function_call: 'auto',
    })

    const responseMessage = response.choices[0].message

    // If GPT wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name
      const functionArgs = JSON.parse(responseMessage.function_call.arguments)

      // Map function calls to your existing APIs
      let functionResponse
      switch (functionName) {
        case 'register_organization':
          functionResponse = await registerOrganization(functionArgs, supabase)
          break
        case 'create_agent':
          functionResponse = await createAgent(functionArgs, supabase)
          break
        case 'get_health_info':
          functionResponse = await getHealthInfo(functionArgs)
          break
        case 'schedule_appointment':
          functionResponse = await scheduleAppointment(functionArgs, supabase)
          break
        default:
          throw new Error(`Unknown function: ${functionName}`)
      }

      // Send the function response back to GPT
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          ...gptMessages,
          responseMessage,
          {
            role: 'function' as const,
            name: functionName,
            content: JSON.stringify(functionResponse),
          },
        ],
      })

      return NextResponse.json({
        message: secondResponse.choices[0].message,
        function_called: functionName,
        function_response: functionResponse
      })
    }

    // If no function call, return the regular response
    return NextResponse.json({
      message: responseMessage
    })

  } catch (error) {
    console.error('GPT Health API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process health assistant request' },
      { status: 500 }
    )
  }
}

// Function implementations that map to your existing APIs
async function registerOrganization(args: any, supabase: any) {
  try {
    const { name, type, specialties } = args
    
    // Call your existing organizations API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        type,
        metadata: { specialties: specialties || [] }
      })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Failed to register organization')

    return {
      success: true,
      organization_id: data.id,
      message: `Successfully registered ${name} as a ${type}`
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to register organization'
    }
  }
}

async function createAgent(args: any, supabase: any) {
  try {
    const { organization_id, name, role } = args
    
    // Call your existing agents API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id,
        name,
        role,
        status: 'active'
      })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Failed to create agent')

    return {
      success: true,
      agent_id: data.id,
      message: `Successfully created ${name} as a ${role} for the organization`
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create agent'
    }
  }
}

async function getHealthInfo(args: any) {
  try {
    const { query, context } = args
    
    // Call your existing chat API for health information
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Health question: ${query}${context ? ` Context: ${context}` : ''}`
          }
        ],
        agentId: 'health-assistant',
        locale: 'en'
      })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Failed to get health information')

    return {
      success: true,
      information: data.response || `I can help you with information about "${query}". However, for specific medical advice, please consult with a healthcare professional.`,
      disclaimer: "This information is for general purposes only and should not replace professional medical advice."
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve health information'
    }
  }
}

async function scheduleAppointment(args: any, supabase: any) {
  try {
    const { patient_name, appointment_type, preferred_date, preferred_time, reason } = args
    
    // For now, just return a success message since we're not creating new database tables
    // You can integrate this with your existing appointment system later
    return {
      success: true,
      appointment_id: `temp-${Date.now()}`,
      message: `Appointment scheduled for ${patient_name} on ${preferred_date} at ${preferred_time} for ${appointment_type}`,
      next_steps: "You will receive a confirmation email shortly.",
      note: "This is a demo response. Integrate with your existing appointment system."
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to schedule appointment'
    }
  }
} 