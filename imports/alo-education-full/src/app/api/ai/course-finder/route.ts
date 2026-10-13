import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studyLevel, subjects, destination, intake, englishTest, englishScore, noTest, budget, careerGoal } = body;

    if (!studyLevel || !destination) {
      return NextResponse.json({ error: 'Study level and destination are required' }, { status: 400 });
    }

    const destMap: Record<string, string> = {
      uk: 'United Kingdom',
      usa: 'United States',
      canada: 'Canada',
      australia: 'Australia',
      new_zealand: 'New Zealand',
      ireland: 'Ireland',
      germany: 'Germany',
    };
    const destName = destMap[destination] || destination;

    const budgetMap: Record<string, string> = {
      under_15k: 'under £15,000/year',
      '15k_20k': '£15,000–£20,000/year',
      '20k_25k': '£20,000–£25,000/year',
      '25k_35k': '£25,000–£35,000/year',
      over_35k: 'over £35,000/year',
    };
    const budgetLabel = budgetMap[budget] || 'not specified';

    const userPrompt = `Student profile:
- Study level: ${studyLevel}
- Subject areas: ${subjects.join(', ') || 'any'}
- Destination: ${destName}
- Intake: ${intake || 'any'}
- English test: ${noTest ? 'Not taken yet' : `${englishTest} ${englishScore || ''}`}
- Budget: ${budgetLabel}
- Career goal: ${careerGoal || 'not specified'}

Return exactly 3 course recommendations as a JSON array with this structure (no other text):
[{"name":"MSc Course Name","university":"University Name","match":94,"tuition":"£24,000/year","duration":"1 year","city":"City Name","scholarship":"Available: £5,000 Global Excellence Scholarship","reason":"Why this course matches (1 sentence)"}]

Make the match scores realistic (80-97 range). Use real university names for the selected destination. Ensure courses match the subject areas if provided.`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are ALO Education's AI Course Matching engine. You recommend real university courses based on student profiles. Always respond with valid JSON arrays only. Never include markdown code fences or extra text. Only respond with the raw JSON array.`,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Parse JSON from response — handle possible markdown fences
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let results: Array<{
      name: string;
      university: string;
      match: number;
      tuition: string;
      duration?: string;
      city?: string;
      scholarship?: string;
      reason?: string;
    }>;

    try {
      results = JSON.parse(cleaned);
    } catch {
      // Fallback: return mock results if AI fails
      results = [
        { name: `MSc ${subjects[0] || 'Data Science'}`, university: 'University of Birmingham', match: 94, tuition: '£24,000/year', duration: '1 year', city: 'Birmingham', scholarship: 'Available: £5,000 Global Excellence Scholarship', reason: 'Strong match for your academic profile and career goals' },
        { name: `MSc ${subjects[1] || subjects[0] || 'Computer Science'}`, university: 'University of Manchester', match: 91, tuition: '£27,000/year', duration: '1 year', city: 'Manchester', scholarship: 'Available: £4,000 Manchester Global Scholarship', reason: 'Excellent research reputation in your field of interest' },
        { name: `MSc ${subjects[2] || subjects[0] || 'Business Analytics'}`, university: 'Aston University', match: 88, tuition: '£21,500/year', duration: '1 year', city: 'Birmingham', scholarship: 'Available: £3,000 Aston Global Scholarship', reason: 'Great value with strong industry connections' },
      ];
    }

    // Ensure we have exactly 3 results, sorted by match score descending
    const finalResults = results
      .slice(0, 5)
      .sort((a, b) => (b.match || 0) - (a.match || 0))
      .slice(0, 3)
      .map((r) => ({
        name: r.name || 'Recommended Course',
        university: r.university || 'Top University',
        match: Math.min(99, Math.max(80, r.match || 85)),
        tuition: r.tuition || 'Contact for pricing',
        duration: r.duration || '1 year',
        city: r.city || '',
        scholarship: r.scholarship || '',
        reason: r.reason || 'Strong match based on your preferences',
      }));

    return NextResponse.json({
      success: true,
      results: finalResults,
      selections: { studyLevel, subjects, destination, intake, englishTest, englishScore, noTest, budget, careerGoal },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'AI service unavailable';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
