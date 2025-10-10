import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/ai/generate-email-template
 * Generate a professional HTML email template from plain text
 */
export async function POST(request: Request) {
  try {
    const { message, subject, businessName, regenerate = false } = await request.json()

    if (!message || !subject) {
      return NextResponse.json(
        { error: 'Message and subject are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `Eres un diseñador experto de emails profesionales. Tu trabajo es transformar mensajes simples en plantillas HTML hermosas y profesionales.

REGLAS IMPORTANTES:
- Crea un HTML moderno y responsivo
- Usa una paleta de colores profesional (púrpura/morado como color principal)
- Incluye un header atractivo con el asunto
- Formatea el contenido de manera clara y legible
- Agrega un footer sencillo
- NO uses imágenes externas
- El diseño debe verse bien en móviles y escritorio
- Mantén el tono profesional pero cálido
- NO incluyas etiquetas <html>, <head>, o <body> - solo el contenido del email

ESTRUCTURA:
1. Header con el asunto
2. Contenido principal bien formateado
3. Footer simple

Genera SOLO el HTML, sin explicaciones adicionales.`

    const userPrompt = regenerate
      ? `Genera una NUEVA versión del email con un diseño diferente pero igual de profesional.

Asunto: ${subject}
Mensaje: ${message}
${businessName ? `Negocio: ${businessName}` : ''}`
      : `Transforma este mensaje en un email profesional y atractivo:

Asunto: ${subject}
Mensaje: ${message}
${businessName ? `Negocio: ${businessName}` : ''}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: regenerate ? 0.9 : 0.7,
      max_tokens: 2000,
    })

    const htmlTemplate = response.choices[0]?.message?.content?.trim()

    if (!htmlTemplate) {
      return NextResponse.json(
        { error: 'Failed to generate template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ html: htmlTemplate })
  } catch (error: any) {
    console.error('Error generating email template:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

