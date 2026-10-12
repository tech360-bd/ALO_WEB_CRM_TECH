import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, title } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const script = generateEducationScript(topic, title || topic);

    return NextResponse.json({
      script,
      topic,
      title: title || topic,
      wordCount: script.split(/\s+/).length,
      estimatedDuration: Math.ceil(script.split(/\s+/).length / 150),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate script', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateEducationScript(topic: string, title: string): string {
  return `[HOOK - First 5 seconds]
Are you dreaming of ${topic.toLowerCase()}? You're not alone — and this video will show you exactly how to make it happen.

[INTRO - 10 seconds]
Hi, I'm [Presenter] from ALO Education, and today we're breaking down everything you need to know about ${topic.toLowerCase()}.

[MAIN CONTENT]

**Section 1: Why ${topic}?**
${topic} is one of the most sought-after paths for international students. Here's why:
- World-class education and globally recognized degrees
- Diverse, multicultural environment that welcomes international students
- Excellent post-study work opportunities and career pathways
- Strong research infrastructure and innovation ecosystem

**Section 2: Top Universities & Programs**
When it comes to ${topic.toLowerCase()}, these institutions stand out:
- [University 1] — Known for [specialty]
- [University 2] — Renowned for [program]
- [University 3] — Leading in [field]
Each of these universities offers programs specifically designed for international student success.

**Section 3: Admission Requirements**
To get started, you'll need:
- Academic transcripts with minimum GPA requirements
- English proficiency test (IELTS/TOEFL/PTE)
- Statement of Purpose that tells your unique story
- Letters of Recommendation from academic or professional contacts
- A complete application with all supporting documents

**Section 4: Costs & Scholarships**
Understanding the financial investment is crucial:
- Tuition ranges vary by program and institution
- Living expenses depend on city and lifestyle
- Multiple scholarship opportunities are available for international students
- ALO Education can help you find and apply for financial aid

**Section 5: Visa Process**
The student visa process is straightforward when you have the right guidance:
1. Receive your university offer letter
2. Prepare your visa application documents
3. Submit your application and attend biometrics
4. Receive your visa and prepare for departure

[CALL TO ACTION]
Ready to start your journey? Visit aloeducation.com or click the link below to book a free consultation with our expert counselors. We've helped 10,000+ students achieve their study abroad dreams — and you could be next!

[OUTRO]
Subscribe for more education guides and tips. This is ALO Education — your pathway to global learning.`;
}
