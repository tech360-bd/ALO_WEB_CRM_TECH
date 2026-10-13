import { NextRequest, NextResponse } from "next/server";
import { aiChat, extractJson } from "@/lib/ai";

// AI course & university matcher
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studyLevel, studyArea, preferredCountries, budget, englishScore, academicGrade } = body;

  const systemPrompt = `You are ALO AI Course Matcher. Based on the student profile, suggest 3 realistic, well-known universities and courses that match. Do NOT invent fake universities — use real, reputable institutions.

Student profile:
- Study level: ${studyLevel}
- Study area: ${studyArea}
- Preferred countries: ${preferredCountries?.join(", ") || "Any"}
- Budget: ${budget || "Not specified"}
- English score: ${englishScore || "Not specified"}
- Academic grade/CGPA: ${academicGrade || "Not specified"}

Return ONLY valid JSON (no markdown) in this shape:
{
  "matches": [
    {
      "university": "<real university name>",
      "course": "<course name>",
      "country": "<country>",
      "intake": "<next intake month/year>",
      "tuitionFee": "<approx tuition>",
      "matchScore": <0-100>,
      "reason": "<why it matches>",
      "requirements": ["<key requirement 1>", "<requirement 2>"]
    }
  ],
  "checklist": ["<next step 1>", "<next step 2>", "<next step 3>"],
  "notes": "<any verification note>"
}`;

  const raw = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Suggest 3 matching universities and return the JSON now." },
  ], { temperature: 0.4 });
  const parsed = extractJson(raw);
  return NextResponse.json(parsed ?? { matches: [], notes: raw });
}
