import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'llama3-70b-8192',
];

// Helper to strip markdown section titles/headers if the AI outputs them
function cleanBioText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(Executive Hook|Value & Mission Statement|Executive Hook & Mission Statement|Value & Mission|Mentorship Value Bullets)\*\*:?\s*/gi, '')
    .replace(/(Executive Hook|Value & Mission Statement|Executive Hook & Mission Statement|Value & Mission|Mentorship Value Bullets):?\s*/gi, '')
    .replace(/^(\d+\.\s*)+(Executive Hook|Value & Mission Statement|Mentorship Value Bullets):?\s*/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      rawBio = '',
      fullName = '',
      jobTitle = '',
      company = '',
      expYears = '',
      country = '',
      primaryExpertise = '',
      secondaryExpertise = '',
      industrySector = '',
      disciplines = [],
      tools = [],
    } = body;

    const apiKey = process.env.GROQ_API_KEY;

    // Fallback if GROQ_API_KEY is not configured in .env.local
    if (!apiKey) {
      console.warn('GROQ_API_KEY missing, using fallback enhancement template');
      const enhancedFallback = `${jobTitle ? `${jobTitle}` : 'Experienced Professional'} ${
        company ? `at ${company}` : ''
      } ${
        expYears ? `with ${expYears}+ years of experience` : ''
      } specializing in ${primaryExpertise || 'technology & design'} across the ${
        industrySector || 'tech'
      } industry.\n\nPassionate about helping learners master modern industry skills, scale their careers, and build real-world products.\n\nI can assist you with:\n- ${
        disciplines[0] || 'Portfolio & Resume Reviews'
      }\n- ${disciplines[1] || 'Industry Best Practices & Workflows'}\n- ${
        tools[0] ? `Hands-on mentoring in ${tools.slice(0, 3).join(', ')}` : 'Career Transitions & Technical Mentorship'
      }`;

      return NextResponse.json({ enhancedBio: enhancedFallback });
    }

    const systemPrompt = `You are an elite executive career coach and LinkedIn bio copywriter for CSCN.
Your task is to take the instructor's details and rough notes and generate a polished, professional instructor bio.

CRITICAL INSTRUCTIONS:
- Do NOT output section headers or titles like "**Executive Hook**" or "**Value & Mission Statement**".
- Do NOT output numbers or markdown label headings.
- Output ONLY the clean paragraphs and bullet points directly.

BIO STRUCTURE TO FOLLOW (WITHOUT WRITING THE HEADER LABELS):
Paragraph 1: Introduce the instructor with their role, company, years of experience, and primary domain expertise.
Paragraph 2: State their passion for teaching, leadership background, or specialized industry insights.
Paragraph 3: End with "I can assist you with:" followed by 3 crisp bullet points starting with hyphen (- ).

Tone: Warm, confident, inspiring, and concise. No corporate jargon.`;

    const userPrompt = `Instructor Details:
- Name: ${fullName || session.user.name || 'Instructor'}
- Title/Role: ${jobTitle || 'Senior Specialist'}
- Company/School: ${company || 'Top Tech Organization'}
- Experience: ${expYears ? `${expYears} years` : 'Experienced'}
- Country: ${country || 'Global'}
- Primary Domain: ${primaryExpertise}
- Secondary Domain: ${secondaryExpertise}
- Industry Sector: ${industrySector}
- Relevant Disciplines: ${Array.isArray(disciplines) ? disciplines.join(', ') : ''}
- Core Tools: ${Array.isArray(tools) ? tools.join(', ') : ''}
- Instructor's Rough Notes/Bio: "${rawBio}"

Write the clean enhanced bio now:`;

    let rawEnhancedBio: string | null = null;
    let lastError: string | null = null;

    // Loop through candidate models until one succeeds
    for (const modelId of CANDIDATE_MODELS) {
      try {
        console.log(`Attempting Groq AI enhancement with model: ${modelId}`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 450,
          }),
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          rawEnhancedBio = data.choices[0].message.content.trim();
          console.log(`Successfully generated bio with Groq model: ${modelId}`);
          break;
        } else {
          lastError = data?.error?.message || response.statusText;
          console.warn(`Groq model ${modelId} failed: ${lastError}`);
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Groq fetch error with model ${modelId}:`, lastError);
      }
    }

    if (!rawEnhancedBio) {
      console.warn('All Groq models failed or unavailable. Falling back to local template.');
      const localFallback = `${jobTitle ? `${jobTitle}` : 'Experienced Professional'} ${
        company ? `at ${company}` : ''
      } ${
        expYears ? `with ${expYears}+ years of experience` : ''
      } specializing in ${primaryExpertise || 'technology & design'}.\n\nPassionate about helping learners master modern industry skills, scale their careers, and build real-world products.\n\nI can assist you with:\n- ${
        disciplines[0] || 'Portfolio & Resume Reviews'
      }\n- ${disciplines[1] || 'Industry Best Practices & Workflows'}\n- ${
        tools[0] ? `Hands-on mentoring in ${tools.slice(0, 3).join(', ')}` : 'Career Transitions & Technical Mentorship'
      }`;

      return NextResponse.json({ enhancedBio: localFallback });
    }

    const sanitizedBio = cleanBioText(rawEnhancedBio);

    return NextResponse.json({
      enhancedBio: sanitizedBio,
    });
  } catch (error: unknown) {
    console.error('Error enhancing bio with Groq AI:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred while enhancing your bio.' },
      { status: 500 }
    );
  }
}
