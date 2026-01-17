const pdf = require('pdf-parse')

export interface ParsedTenderOpportunity {
  title: string
  description?: string
  estimatedValue?: number
  closingDate?: string
  category?: string
}

export async function parseProcurementPDF(buffer: Buffer): Promise<ParsedTenderOpportunity[]> {
  try {
    const data = await pdf(buffer)
    const text = data.text

    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('[PDF Parser] Replicate API Token missing. Returning dummy data.')
      return [
        {
          title: "Setup Replicate to see real extraction",
          description: "Once you add your REPLICATE_API_TOKEN, this engine will extract real tender data from your PDFs using AI.",
          closingDate: new Date().toISOString(),
          category: "Configuration"
        }
      ]
    }

    const prompt = `You are an expert South African tender analyst. Extract procurement opportunities from this government tender document text.

Return ONLY valid JSON in this exact format:
{
  "opportunities": [
    {
      "title": "Tender title",
      "description": "Brief description",
      "estimatedValue": 1000000,
      "closingDate": "2024-12-31T23:59:59Z",
      "category": "Construction/IT/Consulting/etc"
    }
  ]
}

Document text:
${text.substring(0, 15000)}`

    // Using GPT-4o via Replicate
    const response = await fetch('https://api.replicate.com/v1/models/openai/gpt-4o/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          max_tokens: 2000,
          temperature: 0.1,
          top_p: 0.9
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Replicate API error: ${error.detail || response.statusText}`)
    }

    const result = await response.json()
    const output = result.output?.join('') || ''

    // Extract JSON from the response
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[PDF Parser] No valid JSON found in AI response')
      return []
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.opportunities || []
  } catch (error: any) {
    console.error('[PDF Parser] Error:', error.message)
    throw new Error('Failed to parse PDF document')
  }
}
