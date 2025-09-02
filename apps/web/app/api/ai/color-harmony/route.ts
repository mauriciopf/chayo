import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Request schema
const ColorHarmonyRequestSchema = z.object({
  currentColors: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }),
  changedField: z.enum(['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor']).optional(),
  businessType: z.string().optional(),
});

// Response schema
const ColorHarmonyResponseSchema = z.object({
  description: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentColors, changedField, businessType } = ColorHarmonyRequestSchema.parse(body);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build the system prompt
    const systemPrompt = `You are a professional color theory expert and UI/UX designer. Your task is to suggest harmonious color combinations for mobile app themes.

RULES:
1. Always ensure sufficient contrast between background and text colors (WCAG AA compliance)
2. Primary color should be vibrant and attention-grabbing for buttons and highlights
3. Secondary color should complement the primary without competing
4. Consider color psychology and brand perception
5. Ensure colors work well together in a mobile interface context

CURRENT COLORS:
${Object.entries(currentColors).map(([key, value]) => `${key}: ${value || 'not set'}`).join('\n')}

${changedField ? `The user just changed: ${changedField}` : ''}
${businessType ? `Business type: ${businessType}` : ''}

Respond with a JSON object containing:
- description: A brief explanation (2-3 sentences) of why these colors work well together
- primaryColor: Hex color for buttons and highlights
- secondaryColor: Hex color for secondary elements
- backgroundColor: Hex color for main background
- textColor: Hex color for text (ensure good contrast with background)

Focus on creating a cohesive, professional, and accessible color palette.`;

    const userPrompt = `Please suggest a harmonious color palette based on the current selection. Make sure all colors work well together and provide good accessibility.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let colorSuggestion;
    try {
      colorSuggestion = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response
    const validatedResponse = ColorHarmonyResponseSchema.parse(colorSuggestion);

    return NextResponse.json(validatedResponse);

  } catch (error) {
    console.error('Color harmony API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate color suggestions' },
      { status: 500 }
    );
  }
}
