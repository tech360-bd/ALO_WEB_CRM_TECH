import { NextRequest, NextResponse } from 'next/server';

// POST — AI Study Assistant endpoint
export async function POST(req: NextRequest) {
  try {
    const { message, studentProfile, conversationHistory } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // Try using z-ai-web-dev-sdk for real LLM response
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const profileContext = studentProfile?.name
        ? `Student Profile: Name: ${studentProfile.name}, Qualification: ${studentProfile.qualification || 'Not specified'}, Budget: ${studentProfile.budget || 'Not specified'}, Preferred Countries: ${studentProfile.preferredCountries?.join(', ') || 'Not specified'}`
        : 'Student profile not yet provided.';

      const historyContext = conversationHistory?.length
        ? `Previous conversation:\n${conversationHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n`
        : '';

      const systemPrompt = `You are ALO AI, an expert study-abroad assistant for ALO Education, Bangladesh's leading education consultancy. You specialize in helping Bangladeshi students with:

- Country and university selection based on profile and budget
- Student visa process guidance (UK Tier 4, US F-1, Canada Study Permit, Australia Subclass 500, etc.)
- Scholarship information for Bangladeshi students
- Cost planning (tuition, living costs, visa fees in BDT)
- Course recommendations and career prospects
- IELTS/PTE/TOEFL preparation advice
- SOP and CV writing tips
- Post-study work visa and immigration pathways

${profileContext}

Key facts:
- Currency: All costs should be mentioned in both local currency and BDT (1 GBP ≈ 152 BDT, 1 USD ≈ 120 BDT, 1 CAD ≈ 88 BDT, 1 AUD ≈ 78 BDT, 1 EUR ≈ 130 BDT)
- Main destinations: UK, USA, Canada, Australia, Germany, New Zealand, Ireland, Netherlands, Sweden, Denmark, Japan, Malaysia, UAE
- ALO Education has offices in Dhaka, Chattogram, Sylhet, and London

Rules:
- Be specific and actionable with advice
- Always mention costs in BDT when relevant
- Suggest ALO Education services when appropriate (visa filing, SOP writing, scholarship applications)
- If recommending countries/universities, explain WHY they fit the student's profile
- Be honest about challenges (rejection rates, hidden costs, competitive programs)
- Never invent specific university admission requirements - provide general guidance instead`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

      return NextResponse.json({ success: true, response });
    } catch (sdkError) {
      console.error('SDK error, falling back to demo:', sdkError);
      // Fall through to demo response
    }

    // Fallback demo responses
    const lower = message.toLowerCase();
    let response = '';

    if (lower.includes('computer science') || lower.includes('cs') || lower.includes('which country') || lower.includes('best country')) {
      response = `For Computer Science, the top destinations for Bangladeshi students are:\n\n🇺🇸 **USA** — Best CS programs globally (MIT, Stanford, CMU). Higher tuition ($30-50K/yr) but excellent 3-year OPT for STEM.\n\n🇬🇧 **UK** — Strong CS with 2-year PSW visa. Tuition: £15-25K/yr.\n\n🇨🇦 **Canada** — Growing tech hub, easiest PR pathway. Tuition: CAD 20-40K/yr.\n\n🇩🇪 **Germany** — Tuition-free at public universities! Best for budget-conscious students.\n\n🇦🇺 **Australia** — Good programs with 2-4 year post-study work. Tuition: AUD 20-45K/yr.\n\n**Recommendation:** Germany for affordability, USA for prestige, Canada for immigration.`;
    } else if (lower.includes('visa') || lower.includes('tier 4') || lower.includes('f-1') || lower.includes('study permit')) {
      response = `I can help with visa guidance for any country! Here's a quick overview:\n\n🇬🇧 **UK Student Visa**: CAS required, £348 fee + £470/yr IHS, 3-week processing\n🇺🇸 **US F-1 Visa**: I-20 required, $185 SEVIS + $185 application, interview at US Embassy Dhaka\n🇨🇦 **Canada Study Permit**: LOA required, CAD $150 application + $85 biometrics, 4-8 weeks\n🇦🇺 **Australia Subclass 500**: CoE required, AUD $650 application + biometrics, 2-4 weeks\n🇩🇪 **Germany Student Visa**: Admission/conditional letter, €75 fee, 4-8 weeks\n\nWould you like detailed step-by-step guidance for any specific country?`;
    } else if (lower.includes('scholarship') || lower.includes('fund')) {
      response = `Major scholarships for Bangladeshi students:\n\n🏆 **Chevening (UK)** — Full tuition + living, 1-yr Master's. Deadline: Nov\n🏆 **Commonwealth (UK)** — Full funding for developing countries. Deadline: Dec\n🏆 **Fulbright (USA)** — Full funding for Master's/PhD\n🏆 **DAAD (Germany)** — €934/month + tuition waiver\n🏆 **Australia Awards** — Full funding for developing countries\n🏆 **Vanier (Canada)** — CAD $50,000/yr for PhD\n\n💡 Apply 8-12 months before intake. ALO Education can help with scholarship essays!`;
    } else {
      response = `Thank you for your question! I'm ALO AI, your study abroad assistant. I can help with:\n\n- 🌍 Country selection based on your profile\n- 🎓 University & course recommendations\n- 📋 Visa process guidance\n- 💰 Scholarship information\n- 💲 Cost planning in BDT\n- 📝 SOP/CV writing tips\n\nCould you share more details about your background (qualification, budget, preferred destination)? This helps me give personalized advice!`;
    }

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Study assistant error:', error);
    return NextResponse.json({ success: false, error: 'AI service temporarily unavailable' }, { status: 503 });
  }
}
