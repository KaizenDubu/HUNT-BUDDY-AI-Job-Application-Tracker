import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'Valid job description text is required.' },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are an expert HR assistant. Extract structured job details from the provided job posting text.
      
      You MUST return a JSON object with EXACTLY these keys:
      - "company_name": String
      - "job_title": String
      - "location": String
      - "employment_type": String
      - "salary_range": String
      - "key_skills": Array of Strings
      - "summary": String
    `;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText.slice(0, 6000) },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from AI provider.');
    }

    const parsedData = JSON.parse(content);
    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: 'Failed to process job description with AI.' },
      { status: 500 }
    );
  }
}
