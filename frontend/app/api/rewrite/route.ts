import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent'
];

async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  let lastError: Error | unknown;

  for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
    const apiUrl = GEMINI_MODELS[modelIndex];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} with model ${modelIndex + 1}/${GEMINI_MODELS.length}`);
        
        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        };

        const response = await fetch(`${apiUrl}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        console.log(`Model ${modelIndex + 1} response status:`, response.status);

        if (response.ok && !data.error) {
          return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        }

        // If overloaded, try next attempt or next model
        if (data.error?.message?.includes('overloaded') || response.status === 503) {
          console.log(`Model ${modelIndex + 1} is overloaded, attempt ${attempt}/${maxRetries}`);
          lastError = data.error;
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
          // If max retries reached, try next model
          break;
        }

        // For other errors, throw immediately
        throw new Error(data.error?.message || `HTTP ${response.status}`);

      } catch (error) {
        console.error(`Error with model ${modelIndex + 1}, attempt ${attempt}:`, error);
        lastError = error;
        
        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  // If all models and retries failed
  throw lastError || new Error('All models failed');
}

export async function POST(request: NextRequest) {
  try {
    const { text, style } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const styleInstruction = style ? ` in a ${style} style` : '';
    const prompt = `Please rewrite the following text to improve clarity, grammar, and flow${styleInstruction}. Keep the core meaning intact but make it more engaging and well-structured:

"${text}"

Rewritten text:`;

    try {
      const rewrittenText = await callGeminiWithRetry(prompt);
      return NextResponse.json({ rewrittenText });
    } catch (error) {
      console.error('All retry attempts failed:', error);
      
      // Check if it's an overload error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('overloaded')) {
        return NextResponse.json(
          { error: 'The AI service is currently overloaded. Please try again in a few moments.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to rewrite text: ${errorMessage}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in rewrite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
