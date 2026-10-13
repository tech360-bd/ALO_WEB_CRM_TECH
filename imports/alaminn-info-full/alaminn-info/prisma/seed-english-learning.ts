/**
 * English Learning seed — populates the platform with realistic sample
 * data: 6 courses (1 per level: beginner, intermediate, advanced, IELTS,
 * TOEFL, PTE), 4-6 lessons per course, 4 practice tests with 5-8
 * questions each, 4 tutors, 6 resources.
 *
 * Idempotent — uses `upsert` on slugs so re-running the seed is safe.
 *
 * Run: `bun run prisma/seed-english-learning.ts` (called from seed.ts)
 */
import { db } from "@/lib/db";

// ─── Courses (6) ─────────────────────────────────────────────────────

interface CourseSeed {
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: string;
  durationWeeks: number;
  hoursPerWeek: number;
  priceUsd: number | null;
  isFeatured: boolean;
  certificationType: string | null;
  passScore: number | null;
  syllabus: string[];
  prerequisites: string[];
  targetAudience: string[];
  learningOutcomes: string[];
  tags: string[];
}

const COURSES: CourseSeed[] = [
  {
    slug: "english-foundation-a1-a2",
    title: "English Foundation (A1–A2)",
    summary:
      "Build core English skills: present/past tense, everyday vocabulary, simple conversations and short reading texts.",
    description:
      "A 12-week beginner English course designed for absolute beginners and false beginners. We cover the present simple, past simple, future forms, question forms, modal verbs (can, must, should), countable/uncountable nouns, articles and basic sentence structure. Vocabulary is organised around everyday themes: family, food, travel, work, shopping, health. By the end of the course you will be able to introduce yourself, describe your daily routine, ask for directions, order food and write a short personal email.",
    level: "beginner",
    durationWeeks: 12,
    hoursPerWeek: 4,
    priceUsd: 89,
    isFeatured: true,
    certificationType: "Alaminn.info Foundation Certificate",
    passScore: 60,
    syllabus: [
      "Week 1–2: Present simple, personal introductions, daily routines",
      "Week 3–4: Past simple, regular & irregular verbs, storytelling",
      "Week 5–6: Future forms (will / going to), making plans",
      "Week 7–8: Modal verbs, asking permission, giving advice",
      "Week 9–10: Countable / uncountable nouns, food & quantities",
      "Week 11–12: Review, practice conversations, final assessment",
    ],
    prerequisites: [
      "No prior English knowledge required",
      "A device with internet access for video lessons",
    ],
    targetAudience: [
      "Absolute beginners (CEFR A1)",
      "False beginners who studied English years ago",
      "Learners preparing for everyday life in an English-speaking country",
    ],
    learningOutcomes: [
      "Introduce yourself and talk about your family, job and hobbies",
      "Use present, past and future tenses in simple sentences",
      "Ask and answer questions in everyday situations",
      "Write a short personal email (50–80 words)",
      "Read short texts and identify key information",
    ],
    tags: ["beginner", "grammar", "vocab", "speaking"],
  },
  {
    slug: "intermediate-english-b1-b2",
    title: "Intermediate English (B1–B2)",
    summary:
      "Develop fluency, academic register and the grammar needed for everyday work and study.",
    description:
      "An 8-week intermediate English course for learners who can already communicate in simple situations but want to develop fluency, accuracy and academic register. We cover present perfect, conditionals (1st, 2nd, 3rd), reported speech, passive voice, relative clauses, linking words and academic vocabulary. Themes include education, work, technology, environment and society. By the end of the course you will be able to express opinions, write a structured paragraph (150–200 words) and follow short academic lectures.",
    level: "intermediate",
    durationWeeks: 8,
    hoursPerWeek: 5,
    priceUsd: 129,
    isFeatured: true,
    certificationType: "Alaminn.info Intermediate Certificate",
    passScore: 65,
    syllabus: [
      "Week 1: Present perfect vs. past simple, life experiences",
      "Week 2: 1st & 2nd conditionals, hypothetical situations",
      "Week 3: 3rd conditional & mixed conditionals, regrets",
      "Week 4: Reported speech, summarising conversations",
      "Week 5: Passive voice, news & academic reporting",
      "Week 6: Relative clauses, defining & non-defining",
      "Week 7: Linking words, cohesion in writing",
      "Week 8: Review, mock assessment, feedback",
    ],
    prerequisites: [
      "CEFR A2+ or equivalent (comfortable with present, past, future)",
      "Vocabulary of ~1500–2000 words",
    ],
    targetAudience: [
      "Learners at CEFR B1 moving to B2",
      "Professionals using English at work",
      "Students preparing for academic study in English",
    ],
    learningOutcomes: [
      "Express opinions clearly and justify them with reasons",
      "Use perfect and conditional tenses accurately",
      "Write a structured paragraph (150–200 words) with linking words",
      "Follow short academic lectures and identify key points",
      "Use 800+ new academic vocabulary items",
    ],
    tags: ["intermediate", "grammar", "writing", "academic"],
  },
  {
    slug: "advanced-english-c1-c2",
    title: "Advanced English (C1–C2)",
    summary:
      "Refine nuance, idiomatic expression and academic writing for near-native fluency.",
    description:
      "A 10-week advanced English course for learners at CEFR C1 moving to C2. We focus on nuance, idiomatic expression, advanced grammar (inversion, cleft sentences, subjunctive), academic writing style, critical reading and discourse analysis. Themes include philosophy, science, politics, arts and culture. By the end of the course you will be able to write a 500-word academic essay with sophisticated structure, follow complex lectures and participate fluently in debates.",
    level: "advanced",
    durationWeeks: 10,
    hoursPerWeek: 6,
    priceUsd: 199,
    isFeatured: true,
    certificationType: "Alaminn.info Advanced Certificate",
    passScore: 70,
    syllabus: [
      "Week 1–2: Inversion, emphatic structures, advanced sentence variety",
      "Week 3–4: Cleft sentences, subjunctive mood, nuance",
      "Week 5–6: Idiomatic language, collocations, phrasal verbs",
      "Week 7–8: Academic writing style, hedging, citation",
      "Week 9–10: Critical reading, discourse analysis, final essay",
    ],
    prerequisites: [
      "CEFR B2+ or equivalent",
      "Comfortable writing 200-word structured paragraphs",
      "Vocabulary of ~3500+ words",
    ],
    targetAudience: [
      "Learners at CEFR C1 moving to C2",
      "Academics and researchers publishing in English",
      "Professionals in diplomatic, legal or editorial roles",
    ],
    learningOutcomes: [
      "Write a 500-word academic essay with sophisticated structure",
      "Use inversion, cleft sentences and the subjunctive accurately",
      "Understand and use 100+ idiomatic expressions",
      "Follow complex academic lectures and debates",
      "Edit your own writing for style, clarity and register",
    ],
    tags: ["advanced", "academic", "writing", "c1", "c2"],
  },
  {
    slug: "ielts-academic-band-7-bootcamp",
    title: "IELTS Academic Band 7+ Bootcamp",
    summary:
      "Comprehensive IELTS Academic prep covering all 4 sections — Reading, Listening, Writing and Speaking — targeting Band 7.0+.",
    description:
      "An intensive 6-week IELTS Academic prep course designed for learners targeting Band 7.0 or higher. We cover all four sections in depth: Academic Reading (skimming, scanning, paragraph headings, True/False/Not Given), Listening (map labelling, multiple choice, matching), Writing (Task 1 graph description + Task 2 essay), and Speaking (Part 1, 2, 3 with model answers). Includes 4 full-length mock tests with detailed feedback.",
    level: "ielts",
    durationWeeks: 6,
    hoursPerWeek: 8,
    priceUsd: 249,
    isFeatured: true,
    certificationType: "Alaminn.info IELTS Prep Certificate",
    passScore: 75,
    syllabus: [
      "Week 1: Reading — skimming, scanning, paragraph headings",
      "Week 2: Listening — map labelling, multiple choice, matching",
      "Week 3: Writing Task 1 — graph description, data comparison",
      "Week 4: Writing Task 2 — argumentative essay structure",
      "Week 5: Speaking — Part 1, 2 (cue card), 3 (abstract)",
      "Week 6: 4 full mock tests with detailed feedback",
    ],
    prerequisites: [
      "CEFR B2 or equivalent (intermediate-upper)",
      "Target Band 7.0 or higher",
    ],
    targetAudience: [
      "Students applying to UK/EU/AU universities",
      "Professionals seeking UKVI Academic approval",
      "Anyone targeting Band 7.0+ on IELTS Academic",
    ],
    learningOutcomes: [
      "Score Band 7.0 or higher on all four sections",
      "Write a structured Task 2 essay (250+ words) in 40 minutes",
      "Describe graphs and charts accurately in Task 1 (150+ words)",
      "Speak fluently for 2 minutes on a cue card topic",
      "Identify distractors in Listening and Reading",
    ],
    tags: ["ielts", "academic", "band-7", "test-prep"],
  },
  {
    slug: "toefl-ibt-90-plus",
    title: "TOEFL iBT 90+ Prep",
    summary:
      "Target TOEFL iBT score 90+ with focused prep on Reading, Listening, Speaking and Writing sections.",
    description:
      "An 8-week TOEFL iBT prep course designed for learners targeting a score of 90 or higher. Covers all four sections: Reading (3–4 passages, 30–40 questions), Listening (lectures + conversations), Speaking (4 tasks, 17 minutes), and Writing (integrated + independent). Includes 3 full-length mock tests with feedback. We focus on time management, note-taking strategies and the integrated tasks that distinguish TOEFL from IELTS.",
    level: "toefl",
    durationWeeks: 8,
    hoursPerWeek: 7,
    priceUsd: 229,
    isFeatured: false,
    certificationType: "Alaminn.info TOEFL Prep Certificate",
    passScore: 75,
    syllabus: [
      "Week 1–2: Reading — passage analysis, question types",
      "Week 3–4: Listening — lecture note-taking, conversation inference",
      "Week 5: Speaking — independent + integrated tasks",
      "Week 6: Writing — integrated essay (reading + listening)",
      "Week 7: Writing — independent essay (30 min)",
      "Week 8: 3 full mock tests with feedback",
    ],
    prerequisites: [
      "CEFR B2 or equivalent",
      "Target TOEFL iBT score 90+",
    ],
    targetAudience: [
      "Students applying to US/Canadian universities",
      "Anyone targeting TOEFL iBT 90+",
      "Learners who prefer computer-based testing",
    ],
    learningOutcomes: [
      "Score 90+ on TOEFL iBT",
      "Take effective notes during 5+ minute lectures",
      "Write an integrated essay synthesising reading + listening",
      "Speak coherently for 45–60 seconds on independent tasks",
      "Manage time across the 3-hour test",
    ],
    tags: ["toefl", "ibt", "test-prep", "academic"],
  },
  {
    slug: "pte-academic-58-plus",
    title: "PTE Academic 58+ Prep",
    summary:
      "Target PTE Academic score 58+ with integrated speaking, writing, reading and listening practice.",
    description:
      "A 6-week PTE Academic prep course targeting a score of 58 or higher. PTE is fully computer-based and uses integrated tasks (e.g. read aloud, repeat sentence, describe image, retell lecture, write essay). We cover all 20 task types with strategies, templates and timed practice. Includes 3 full mock tests.",
    level: "pte",
    durationWeeks: 6,
    hoursPerWeek: 6,
    priceUsd: 189,
    isFeatured: false,
    certificationType: "Alaminn.info PTE Prep Certificate",
    passScore: 70,
    syllabus: [
      "Week 1: Speaking — read aloud, repeat sentence",
      "Week 2: Speaking — describe image, retell lecture",
      "Week 3: Writing — summarise written text, essay",
      "Week 4: Reading — multiple choice, reorder paragraph",
      "Week 5: Listening — summarise spoken text, fill blanks",
      "Week 6: 3 full mock tests with feedback",
    ],
    prerequisites: ["CEFR B1+ or equivalent", "Target PTE score 58+"],
    targetAudience: [
      "Students applying to AU/NZ/UK universities",
      "Anyone needing fast English test results (5 days)",
      "Learners who prefer fully computer-based assessment",
    ],
    learningOutcomes: [
      "Score 58+ on PTE Academic",
      "Use templates for all 20 PTE task types",
      "Speak fluently for 30–40 seconds on describe image",
      "Write a structured essay in 20 minutes",
      "Manage the 2-hour single-sitting test format",
    ],
    tags: ["pte", "academic", "test-prep", "computer-based"],
  },
];

// ─── Lessons per course ──────────────────────────────────────────────

interface LessonSeed {
  slug: string;
  title: string;
  summary: string;
  content: string;
  orderIndex: number;
  durationMinutes: number;
  lessonType: string;
  isFreePreview: boolean;
}

const LESSONS_BY_COURSE: Record<string, LessonSeed[]> = {
  "english-foundation-a1-a2": [
    {
      slug: "intro-present-simple",
      title: "Introducing Yourself & Present Simple",
      summary: "Learn present simple tense and how to introduce yourself.",
      content:
        "## Present Simple\n\nWe use the present simple to talk about habits, routines and facts.\n\n**Form:** subject + verb (add -s for he/she/it)\n\n- I **work** in London.\n- She **works** in London.\n\n### Negative\n- I **don't** work on Sundays.\n- She **doesn't** work on Sundays.\n\n### Question\n- **Do** you work here?\n- **Does** she work here?",
      orderIndex: 1,
      durationMinutes: 18,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "family-vocabulary",
      title: "Family Vocabulary",
      summary: "Words for family members and how to talk about relationships.",
      content:
        "## Family Vocabulary\n\n- **mother / mom** — female parent\n- **father / dad** — male parent\n- **sister** — female sibling\n- **brother** — male sibling\n- **grandmother / grandma** — mother of a parent\n- **grandfather / grandad** — father of a parent\n- **aunt** — sister of a parent\n- **uncle** — brother of a parent\n- **cousin** — child of an aunt/uncle",
      orderIndex: 2,
      durationMinutes: 12,
      lessonType: "vocab",
      isFreePreview: false,
    },
    {
      slug: "past-simple-regular",
      title: "Past Simple — Regular Verbs",
      summary: "Form the past simple of regular verbs with -ed.",
      content:
        "## Past Simple — Regular Verbs\n\nAdd **-ed** to the base form:\n\n- work → worked\n- play → played\n- watch → watched\n\n### Spelling rules\n- ends in -e: add -d (live → lived)\n- ends in consonant + y: change y to i, add -ed (study → studied)\n- ends in vowel + consonant (one syllable): double the consonant (stop → stopped)",
      orderIndex: 3,
      durationMinutes: 20,
      lessonType: "grammar",
      isFreePreview: false,
    },
    {
      slug: "everyday-conversations",
      title: "Everyday Conversations",
      summary: "Practice short conversations: greetings, asking for help.",
      content:
        "## Everyday Conversations\n\n### At the shop\n- **Assistant:** Hello, can I help you?\n- **You:** Yes, I'm looking for bread.\n- **Assistant:** It's over there, in aisle 2.\n- **You:** Thank you. How much is it?\n- **Assistant:** It's £1.20.\n\n### Asking for directions\n- Excuse me, where is the station?\n- It's straight ahead, on the left.",
      orderIndex: 4,
      durationMinutes: 15,
      lessonType: "speaking",
      isFreePreview: false,
    },
    {
      slug: "reading-short-text",
      title: "Reading: A Day in the Life",
      summary: "Read a short text about a typical day and answer comprehension questions.",
      content:
        "## Reading Practice\n\nRead the following short text:\n\n> My name is Maria. I'm 28 years old and I live in Madrid. I work in a bank. I get up at 7am every day. I have breakfast — usually coffee and a croissant. I start work at 9am. I have lunch at 1pm. I finish work at 5pm. In the evening, I go to the gym or meet friends. I go to bed at 11pm.\n\n**Comprehension questions:**\n1. Where does Maria live?\n2. What time does she get up?\n3. What does she have for breakfast?\n4. Where does she work?",
      orderIndex: 5,
      durationMinutes: 10,
      lessonType: "reading",
      isFreePreview: true,
    },
  ],
  "intermediate-english-b1-b2": [
    {
      slug: "present-perfect-experiences",
      title: "Present Perfect — Life Experiences",
      summary: "Use present perfect to talk about life experiences.",
      content:
        "## Present Perfect — Experiences\n\nForm: **have/has + past participle**\n\n- I **have visited** Paris. (at some point in my life)\n- She **has never eaten** sushi.\n\n### Ever / never\n- **Have** you **ever** been to Japan?\n- I **have never** been to Japan.\n\n### Just / already / yet\n- I **have just** finished my homework.\n- She **has already** left.\n- They **haven't** arrived **yet**.",
      orderIndex: 1,
      durationMinutes: 22,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "first-conditional",
      title: "First Conditional",
      summary: "Talk about real possibilities in the future.",
      content:
        "## First Conditional\n\nForm: **If + present simple, will + base verb**\n\n- If it rains, I **will** stay at home.\n- If you study hard, you **will** pass.\n\n### Variations\n- If it rains, I **might** stay at home. (less certain)\n- If it rains, I **can** stay at home. (ability)\n- If it rains, I **should** stay at home. (advice)",
      orderIndex: 2,
      durationMinutes: 18,
      lessonType: "grammar",
      isFreePreview: false,
    },
    {
      slug: "reported-speech",
      title: "Reported Speech",
      summary: "Report what someone said without quoting them directly.",
      content:
        "## Reported Speech\n\nDirect: She said, \"I am tired.\"\nReported: She said (that) she **was** tired.\n\n### Tense changes\n- present → past (am → was, work → worked)\n- past → past perfect (worked → had worked)\n- will → would (\"I will go\" → she would go)\n- can → could (\"I can swim\" → she could swim)\n\n### Pronouns\n- \"I\" → she/he\n- \"my\" → her/his",
      orderIndex: 3,
      durationMinutes: 25,
      lessonType: "grammar",
      isFreePreview: false,
    },
    {
      slug: "academic-vocabulary",
      title: "Academic Vocabulary (50 words)",
      summary: "50 high-frequency academic words for essays and lectures.",
      content:
        "## Academic Vocabulary\n\n- **analyse** — examine in detail\n- **approach** — method or way of doing something\n- **assume** — take as true without proof\n- **concept** — abstract idea\n- **context** — circumstances surrounding an event\n- **data** — facts and statistics collected together\n- **derive** — obtain something from a specified source\n- **demonstrate** — show clearly\n- **document** — record in writing\n- **emphasise** — give special importance to\n\n…and 40 more in the full lesson.",
      orderIndex: 4,
      durationMinutes: 30,
      lessonType: "vocab",
      isFreePreview: false,
    },
    {
      slug: "paragraph-writing",
      title: "Paragraph Writing (150 words)",
      summary: "Write a structured paragraph with topic sentence + supporting ideas.",
      content:
        "## Paragraph Structure\n\nA good paragraph has:\n1. **Topic sentence** — main idea\n2. **Supporting sentences** — evidence, examples, explanation\n3. **Concluding sentence** — summary or transition\n\n### Example\n> Online learning has several advantages over traditional classrooms. **First**, it is more flexible — students can study at their own pace and at any time of day. **Second**, it is often cheaper because there are no travel or accommodation costs. **Finally**, online courses offer a wider range of subjects than most local schools. **In conclusion**, online learning is a practical and affordable option for many students.",
      orderIndex: 5,
      durationMinutes: 28,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "quiz-intermediate",
      title: "Intermediate Quiz",
      summary: "Test your intermediate English with 10 questions.",
      content:
        "## Intermediate Quiz\n\n10 questions covering present perfect, conditionals, reported speech and academic vocabulary. Take the practice test linked below.",
      orderIndex: 6,
      durationMinutes: 15,
      lessonType: "quiz",
      isFreePreview: true,
    },
  ],
  "advanced-english-c1-c2": [
    {
      slug: "inversion-advanced",
      title: "Inversion & Emphatic Structures",
      summary: "Use inversion for emphasis and stylistic effect.",
      content:
        "## Inversion\n\nIn formal English, we can invert subject and auxiliary after negative adverbials:\n\n- **Never have I** seen such beauty.\n- **Rarely does** she complain.\n- **Not only did** he apologise, **but he also** offered compensation.\n- **Hardly had** I arrived **when** the phone rang.\n- **No sooner had** she sat down **than** the meeting started.",
      orderIndex: 1,
      durationMinutes: 28,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "cleft-sentences",
      title: "Cleft Sentences",
      summary: "Use it-clefts and wh-clefts to focus information.",
      content:
        "## Cleft Sentences\n\n### It-clefts\n**It + be + focus + that/who + rest:**\n- It was **John** who broke the window. (focus on John)\n- It was **in 1995** that the company was founded. (focus on date)\n\n### Wh-clefts (pseudo-clefts)\n**What + clause + be + focus:**\n- What I need is **a long holiday**.\n- What surprised me was **his reaction**.",
      orderIndex: 2,
      durationMinutes: 24,
      lessonType: "grammar",
      isFreePreview: false,
    },
    {
      slug: "idioms-advanced",
      title: "50 Advanced Idioms",
      summary: "Master 50 high-level idiomatic expressions.",
      content:
        "## Advanced Idioms\n\n- **a blessing in disguise** — something that seems bad but turns out good\n- **bite the bullet** — endure a painful situation bravely\n- **break the ice** — start a conversation in a social setting\n- **burn the midnight oil** — work late into the night\n- **cut corners** — do something poorly to save time/money\n- **hit the nail on the head** — describe exactly what is right\n- **let the cat out of the bag** — reveal a secret\n- **once in a blue moon** — very rarely\n- **piece of cake** — very easy\n- **the straw that broke the camel's back** — the final small problem\n\n…and 40 more in the full lesson.",
      orderIndex: 3,
      durationMinutes: 35,
      lessonType: "vocab",
      isFreePreview: false,
    },
    {
      slug: "academic-essay-500-words",
      title: "Writing a 500-Word Academic Essay",
      summary: "Structure, hedging and citation in academic essays.",
      content:
        "## 500-Word Academic Essay\n\n### Structure\n1. **Introduction** (~75 words): hook, context, thesis statement\n2. **Body paragraph 1** (~125 words): first argument + evidence\n3. **Body paragraph 2** (~125 words): second argument + evidence\n4. **Body paragraph 3** (~125 words): counter-argument + rebuttal\n5. **Conclusion** (~50 words): summary, implications\n\n### Hedging\nAcademic writing avoids absolute claims. Use:\n- *tends to, suggests that, may indicate, is likely to*\ninstead of *proves, shows, is*\n\n### Citation\n- (Smith, 2023) for paraphrase\n- (Smith, 2023, p.45) for direct quote",
      orderIndex: 4,
      durationMinutes: 40,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "critical-reading",
      title: "Critical Reading & Discourse Analysis",
      summary: "Analyse texts for argument, bias and rhetorical strategy.",
      content:
        "## Critical Reading\n\nWhen reading critically, ask:\n1. **What is the author's thesis?**\n2. **What evidence is provided?** Is it credible?\n3. **What is omitted?** What counter-evidence is ignored?\n4. **What rhetorical strategies are used?** (ethos, pathos, logos)\n5. **What is the author's positionality?** (institution, funding, prior work)\n\n### Discourse markers\n- *however, nevertheless, on the contrary* — contrast\n- *furthermore, moreover, in addition* — addition\n- *consequently, therefore, thus* — causation",
      orderIndex: 5,
      durationMinutes: 35,
      lessonType: "reading",
      isFreePreview: false,
    },
  ],
  "ielts-academic-band-7-bootcamp": [
    {
      slug: "ielts-reading-skimming-scanning",
      title: "IELTS Reading: Skimming & Scanning",
      summary: "Master the two key reading techniques for IELTS Reading.",
      content:
        "## Skimming & Scanning\n\n### Skim\nRead quickly to get the **gist**. Read the title, sub-headings, first and last sentence of each paragraph. Don't read every word. Goal: understand the main idea in 2–3 minutes.\n\n### Scan\nLook for **specific information** — a date, name, number, keyword. Move your eyes quickly across the text. Goal: find a specific answer in 30 seconds.\n\n### IELTS Reading Strategy\n1. Read the questions first (skim them).\n2. Skim the passage (2–3 min).\n3. For each question, scan for keywords.\n4. Read the relevant sentence carefully.\n5. Write your answer.",
      orderIndex: 1,
      durationMinutes: 25,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "ielts-reading-true-false-not-given",
      title: "IELTS Reading: True / False / Not Given",
      summary: "The hardest IELTS question type — master the distinction.",
      content:
        "## True / False / Not Given\n\n- **True** — the statement agrees with the information in the passage.\n- **False** — the statement contradicts the information.\n- **Not Given** — there is not enough information to say.\n\n### Common trap\nDon't use your general knowledge. Only use the passage.\n\n### Tip\nFind the exact sentence in the passage that matches the statement. Compare word-by-word.",
      orderIndex: 2,
      durationMinutes: 22,
      lessonType: "reading",
      isFreePreview: false,
    },
    {
      slug: "ielts-writing-task-1",
      title: "IELTS Writing Task 1: Graph Description",
      summary: "Write a 150-word description of a graph, chart or diagram.",
      content:
        "## Task 1 Structure (150 words, 20 min)\n\n1. **Introduction** (1 sentence): paraphrase the question.\n2. **Overview** (2 sentences): identify 2 key trends. (No numbers here.)\n3. **Body 1** (~3 sentences): describe the first trend with data.\n4. **Body 2** (~3 sentences): describe the second trend with data.\n\n### Useful language\n- *The graph shows / illustrates / compares…*\n- *Overall, …*\n- *The highest / lowest / most significant…*\n- *There was a sharp increase / steady decline…*\n- *peaked at / reached a low of…*",
      orderIndex: 3,
      durationMinutes: 30,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "ielts-writing-task-2",
      title: "IELTS Writing Task 2: Argumentative Essay",
      summary: "Write a 250-word argumentative essay in 40 minutes.",
      content:
        "## Task 2 Structure (250 words, 40 min)\n\n1. **Introduction** (~40 words): hook + paraphrase + thesis.\n2. **Body 1** (~80 words): first argument + example.\n3. **Body 2** (~80 words): second argument + example.\n4. **Conclusion** (~40 words): summary + final thought.\n\n### Essay types\n- **Opinion** — do you agree or disagree?\n- **Discussion** — discuss both views + your opinion.\n- **Problem/solution** — causes + solutions.\n- **Two-part** — answer both questions.",
      orderIndex: 4,
      durationMinutes: 35,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "ielts-speaking-parts",
      title: "IELTS Speaking: Parts 1, 2 & 3",
      summary: "Strategies for all three speaking parts.",
      content:
        "## IELTS Speaking (11–14 min)\n\n### Part 1 (4–5 min)\nPersonal questions: hometown, work/study, hobbies, food.\nTip: answer in 2–3 sentences. Don't say just yes/no.\n\n### Part 2 (3–4 min)\nCue card: 1 min preparation + 2 min speaking.\nTip: use the prompts on the card to structure your talk.\n\n### Part 3 (4–5 min)\nAbstract questions linked to Part 2 topic.\nTip: give opinions + reasons + examples. Use *In my view, I tend to think that, it could be argued that*.",
      orderIndex: 5,
      durationMinutes: 28,
      lessonType: "speaking",
      isFreePreview: true,
    },
    {
      slug: "ielts-listening-strategies",
      title: "IELTS Listening: Strategies & Distractors",
      summary: "Identify distractors and predict answers.",
      content:
        "## IELTS Listening\n\n### Before listening\n- Read the questions carefully.\n- Underline keywords.\n- Predict the type of answer (number, name, place).\n\n### During listening\n- Watch out for distractors (speaker corrects themselves).\n- Write answers as you hear them.\n- Use abbreviations if you need to.\n\n### After listening\n- Check spelling.\n- Make sure the answer fits grammatically.",
      orderIndex: 6,
      durationMinutes: 22,
      lessonType: "listening",
      isFreePreview: false,
    },
  ],
  "toefl-ibt-90-plus": [
    {
      slug: "toefl-reading-overview",
      title: "TOEFL Reading: Section Overview",
      summary: "Understand the structure and question types of TOEFL Reading.",
      content:
        "## TOEFL Reading\n\n3–4 passages, 30–40 questions, 54–72 minutes.\n\n### Question types\n- **Multiple choice** (1 answer)\n- **Multiple choice** (2+ answers)\n- **Insert text** — where does this sentence fit?\n- **Reading-to-learn** — categorise or summarise\n\n### Strategy\n- Skim first (2 min), then answer questions.\n- Use keywords to scan for answers.\n- Don't spend more than 90 seconds on a question.",
      orderIndex: 1,
      durationMinutes: 25,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "toefl-listening-notes",
      title: "TOEFL Listening: Note-Taking",
      summary: "Take effective notes during 5+ minute lectures.",
      content:
        "## Note-Taking Strategy\n\n- Use **abbreviations**: govt, edu, econ, w/, b/c, →.\n- Use a **vertical list** (not paragraphs).\n- Capture **key terms** + **examples**.\n- Mark **transitions**: defn, example, however, in conclusion.\n- Don't try to write every word — capture the structure.",
      orderIndex: 2,
      durationMinutes: 22,
      lessonType: "listening",
      isFreePreview: false,
    },
    {
      slug: "toefl-speaking-tasks",
      title: "TOEFL Speaking: 4 Tasks",
      summary: "Independent + integrated speaking tasks.",
      content:
        "## TOEFL Speaking (17 min, 4 tasks)\n\n### Task 1: Independent (45 sec)\nPersonal preference / opinion.\n\n### Tasks 2–4: Integrated\n- Task 2: read passage + listen to conversation → speak.\n- Task 3: read passage + listen to lecture → speak.\n- Task 4: listen to lecture → speak.\n\n### Template\n1. State the main idea.\n2. Give 2 reasons / examples.\n3. Conclude briefly.",
      orderIndex: 3,
      durationMinutes: 24,
      lessonType: "speaking",
      isFreePreview: false,
    },
    {
      slug: "toefl-writing-integrated",
      title: "TOEFL Writing: Integrated Essay",
      summary: "Synthesise reading + listening in 20 minutes.",
      content:
        "## Integrated Essay (20 min)\n\nRead a passage (3 min) → listen to a lecture (2 min) → write (15 min).\n\n### Structure (150–225 words)\n1. **Introduction**: state the relationship between reading and lecture (usually contrasts).\n2. **Body 1**: first point of contrast with examples from both.\n3. **Body 2**: second point of contrast.\n4. **Body 3**: third point of contrast.\n\n### Key phrases\n- *The reading argues that… whereas the lecturer contends…*\n- *According to the passage… However, the lecture refutes this by…*",
      orderIndex: 4,
      durationMinutes: 30,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "toefl-writing-independent",
      title: "TOEFL Writing: Independent Essay",
      summary: "Write a 300-word opinion essay in 30 minutes.",
      content:
        "## Independent Essay (30 min, 300+ words)\n\n### Structure\n1. **Introduction** (~50 words): hook + thesis.\n2. **Body 1** (~100 words): first reason + example.\n3. **Body 2** (~100 words): second reason + example.\n4. **Conclusion** (~50 words): summary.\n\n### Tips\n- Type faster — practise with a keyboard.\n- Use transition words.\n- Leave 3 min to proofread.",
      orderIndex: 5,
      durationMinutes: 28,
      lessonType: "writing",
      isFreePreview: true,
    },
  ],
  "pte-academic-58-plus": [
    {
      slug: "pte-read-aloud",
      title: "PTE Speaking: Read Aloud",
      summary: "Master the read aloud task — first speaking task in PTE.",
      content:
        "## Read Aloud\n\n30–40 seconds to read a 60-word passage aloud.\n\n### Scoring\n- **Content**: pronounce every word correctly.\n- **Oral fluency**: smooth, natural pace, no long pauses.\n- **Pronunciation**: clear vowels + consonants.\n\n### Tips\n- Read with expression.\n- Don't rush.\n- Pause at punctuation.\n- Stress content words (nouns, verbs).",
      orderIndex: 1,
      durationMinutes: 18,
      lessonType: "video",
      isFreePreview: true,
    },
    {
      slug: "pte-repeat-sentence",
      title: "PTE Speaking: Repeat Sentence",
      summary: "Listen and repeat a sentence exactly.",
      content:
        "## Repeat Sentence\n\nListen to a 3–9 second sentence, then repeat it exactly.\n\n### Strategy\n- Listen for **meaning**, not individual words.\n- If you forget a word, say what you remember — partial credit.\n- Match the speaker's intonation.\n\n### Practice\nListen to short news clips and repeat them.",
      orderIndex: 2,
      durationMinutes: 15,
      lessonType: "speaking",
      isFreePreview: false,
    },
    {
      slug: "pte-describe-image",
      title: "PTE Speaking: Describe Image",
      summary: "Describe a graph, chart or map in 40 seconds.",
      content:
        "## Describe Image\n\n25 sec to prepare, 40 sec to speak.\n\n### Template\n1. **Introduction**: This image shows / illustrates…\n2. **Key features**: The highest / lowest / most significant…\n3. **Comparison**: Compared to X, Y is…\n4. **Conclusion**: Overall, …\n\n### Tips\n- Don't describe every data point.\n- Speak for the full 40 seconds.\n- Use approximate numbers if you're not sure.",
      orderIndex: 3,
      durationMinutes: 22,
      lessonType: "speaking",
      isFreePreview: false,
    },
    {
      slug: "pte-write-essay",
      title: "PTE Writing: Essay",
      summary: "Write a 200–300 word essay in 20 minutes.",
      content:
        "## PTE Essay (20 min, 200–300 words)\n\n### Template\n1. **Introduction** (~40 words): paraphrase prompt + opinion.\n2. **Body 1** (~80 words): first reason + example.\n3. **Body 2** (~80 words): second reason + example.\n4. **Conclusion** (~30 words): summary.\n\n### Tips\n- Use linking words (however, moreover, therefore).\n- Vary sentence structure.\n- Check spelling and grammar.",
      orderIndex: 4,
      durationMinutes: 28,
      lessonType: "writing",
      isFreePreview: false,
    },
    {
      slug: "pte-listening-fill-blanks",
      title: "PTE Listening: Fill in the Blanks",
      summary: "Listen to a lecture and fill in missing words.",
      content:
        "## Fill in the Blanks\n\nListen to a 30–90 sec audio. The transcript has gaps. Type the missing words.\n\n### Tips\n- Read the transcript before the audio starts.\n- Predict the type of word (noun, verb, number).\n- Watch spelling — must be exact.\n- Don't pluralise unless you hear it.",
      orderIndex: 5,
      durationMinutes: 20,
      lessonType: "listening",
      isFreePreview: true,
    },
  ],
};

// ─── Practice tests (4) ─────────────────────────────────────────────

interface QuestionSeed {
  questionType: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  orderIndex: number;
  skillArea: string;
}

interface PracticeTestSeed {
  slug: string;
  title: string;
  description: string;
  testType: string;
  level: string;
  durationMinutes: number;
  passingScore: number;
  isFeatured: boolean;
  questions: QuestionSeed[];
}

const PRACTICE_TESTS: PracticeTestSeed[] = [
  {
    slug: "ielts-reading-mock-test-1",
    title: "IELTS Academic Reading — Mock Test 1",
    description:
      "A full IELTS Academic Reading mock test: 3 passages, 12 questions (sample). Instant scoring with explanations.",
    testType: "ielts-reading",
    level: "ielts",
    durationMinutes: 30,
    passingScore: 70,
    isFeatured: true,
    questions: [
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'The Industrial Revolution began in Britain in the late 18th century.' When did the Industrial Revolution begin?",
        options: [
          "Early 17th century",
          "Late 18th century",
          "Early 19th century",
          "Mid 20th century",
        ],
        correctAnswer: "B",
        explanation:
          "The passage explicitly states 'late 18th century'. Look for the keyword 'began'.",
        points: 1,
        orderIndex: 1,
        skillArea: "reading",
      },
      {
        questionType: "true-false",
        questionText:
          "Read: 'Coal was the primary fuel of the Industrial Revolution.' True or False: Coal was used during the Industrial Revolution.",
        options: ["true", "false"],
        correctAnswer: "true",
        explanation:
          "The passage says coal was the primary fuel, so the statement is True. Note: True/False/Not Given requires careful reading — this is True because it's confirmed.",
        points: 1,
        orderIndex: 2,
        skillArea: "reading",
      },
      {
        questionType: "fill-blank",
        questionText:
          "Read: 'James Watt improved the steam engine in 1776.' Fill in the blank: James Watt improved the steam engine in the year ____.",
        options: [],
        correctAnswer: "1776",
        explanation: "The passage explicitly states the year 1776.",
        points: 1,
        orderIndex: 3,
        skillArea: "reading",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'Urbanisation was a major consequence of industrialisation.' What was a major consequence of industrialisation?",
        options: [
          "Rural depopulation",
          "Urbanisation",
          "Agricultural decline",
          "Population decrease",
        ],
        correctAnswer: "B",
        explanation: "The passage directly states 'urbanisation' as a major consequence.",
        points: 1,
        orderIndex: 4,
        skillArea: "reading",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'Factory conditions were often dangerous and unhealthy for workers.' What does the passage say about factory conditions?",
        options: [
          "They were safe and clean",
          "They were often dangerous and unhealthy",
          "They were well-regulated",
          "They were comfortable",
        ],
        correctAnswer: "B",
        explanation:
          "The passage uses the exact phrase 'often dangerous and unhealthy'.",
        points: 1,
        orderIndex: 5,
        skillArea: "reading",
      },
      {
        questionType: "true-false",
        questionText:
          "Read: 'Child labour was eventually restricted by the Factory Acts.' True or False: The Factory Acts restricted child labour.",
        options: ["true", "false"],
        correctAnswer: "true",
        explanation:
          "The passage confirms the Factory Acts restricted child labour. Statement is True.",
        points: 1,
        orderIndex: 6,
        skillArea: "reading",
      },
      {
        questionType: "short-answer",
        questionText:
          "Read: 'The Industrial Revolution spread to the United States in the early 19th century.' Which country did the Industrial Revolution spread to in the early 19th century?",
        options: [],
        correctAnswer: "United States",
        explanation:
          "The passage names 'the United States'. 'US' or 'USA' would also be acceptable.",
        points: 1,
        orderIndex: 7,
        skillArea: "reading",
      },
    ],
  },
  {
    slug: "ielts-listening-mock-test-1",
    title: "IELTS Academic Listening — Mock Test 1",
    description:
      "Sample IELTS Listening mock: 4 sections, 7 questions. Read the transcript-style text and answer (since this is a text-based demo).",
    testType: "ielts-listening",
    level: "ielts",
    durationMinutes: 20,
    passingScore: 65,
    isFeatured: true,
    questions: [
      {
        questionType: "multiple-choice",
        questionText:
          "[Audio] 'I'd like to book a table for four at 7pm under the name Wilson.' How many people is the table for?",
        options: ["2", "3", "4", "5"],
        correctAnswer: "C",
        explanation: "The speaker says 'a table for four'.",
        points: 1,
        orderIndex: 1,
        skillArea: "listening",
      },
      {
        questionType: "fill-blank",
        questionText:
          "[Audio] 'My phone number is 020 7946 0958.' Fill in: 020 7946 ____",
        options: [],
        correctAnswer: "0958",
        explanation: "Listen carefully for the last 4 digits.",
        points: 1,
        orderIndex: 2,
        skillArea: "listening",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "[Audio] 'The library is open Monday to Friday, 9am to 6pm.' When is the library closed?",
        options: [
          "Monday",
          "Wednesday",
          "Friday",
          "Sunday",
        ],
        correctAnswer: "D",
        explanation:
          "The library is open Monday to Friday, so it's closed on Sunday.",
        points: 1,
        orderIndex: 3,
        skillArea: "listening",
      },
      {
        questionType: "true-false",
        questionText:
          "[Audio] 'The course costs £350.' True or False: The course costs more than £300.",
        options: ["true", "false"],
        correctAnswer: "true",
        explanation: "£350 is more than £300.",
        points: 1,
        orderIndex: 4,
        skillArea: "listening",
      },
      {
        questionType: "short-answer",
        questionText:
          "[Audio] 'Please bring your passport, a passport photo, and a proof of address.' What document is NOT required: passport, photo, or credit card?",
        options: [],
        correctAnswer: "credit card",
        explanation: "Only passport, photo, and proof of address are required.",
        points: 1,
        orderIndex: 5,
        skillArea: "listening",
      },
    ],
  },
  {
    slug: "toefl-reading-mock-test-1",
    title: "TOEFL iBT Reading — Mock Test 1",
    description:
      "Sample TOEFL Reading mock: 1 passage, 6 questions. Includes insert-text and reading-to-learn question types.",
    testType: "toefl-reading",
    level: "toefl",
    durationMinutes: 20,
    passingScore: 70,
    isFeatured: false,
    questions: [
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'Photosynthesis is the process by which plants convert sunlight into chemical energy.' What is photosynthesis?",
        options: [
          "A type of plant",
          "The conversion of sunlight into chemical energy",
          "A chemical used in farming",
          "A type of soil",
        ],
        correctAnswer: "B",
        explanation: "The passage defines photosynthesis as the conversion of sunlight into chemical energy.",
        points: 1,
        orderIndex: 1,
        skillArea: "reading",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'Chlorophyll is the green pigment that captures light.' What captures light in plants?",
        options: ["Water", "Carbon dioxide", "Chlorophyll", "Oxygen"],
        correctAnswer: "C",
        explanation: "The passage identifies chlorophyll as the pigment that captures light.",
        points: 1,
        orderIndex: 2,
        skillArea: "reading",
      },
      {
        questionType: "true-false",
        questionText:
          "Read: 'Photosynthesis releases oxygen as a by-product.' True or False: Oxygen is produced by photosynthesis.",
        options: ["true", "false"],
        correctAnswer: "true",
        explanation: "The passage states oxygen is a by-product.",
        points: 1,
        orderIndex: 3,
        skillArea: "reading",
      },
      {
        questionType: "fill-blank",
        questionText:
          "Read: 'The chemical formula for glucose is C6H12O6.' Fill in: C6H12____",
        options: [],
        correctAnswer: "O6",
        explanation: "Listen carefully for the formula.",
        points: 1,
        orderIndex: 4,
        skillArea: "reading",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "Read: 'Photosynthesis occurs primarily in the leaves of plants.' Where does photosynthesis primarily occur?",
        options: ["Roots", "Stem", "Leaves", "Flowers"],
        correctAnswer: "C",
        explanation: "The passage says photosynthesis occurs primarily in leaves.",
        points: 1,
        orderIndex: 5,
        skillArea: "reading",
      },
      {
        questionType: "short-answer",
        questionText:
          "Read: 'Photosynthesis requires sunlight, water, and carbon dioxide.' Which gas is required for photosynthesis?",
        options: [],
        correctAnswer: "carbon dioxide",
        explanation: "Carbon dioxide (CO2) is the gas required for photosynthesis.",
        points: 1,
        orderIndex: 6,
        skillArea: "reading",
      },
    ],
  },
  {
    slug: "duolingo-english-test-mock-1",
    title: "Duolingo English Test — Mock Test 1",
    description:
      "Sample Duolingo English Test mock: 6 questions covering literacy, comprehension and production.",
    testType: "duolingo",
    level: "det",
    durationMinutes: 15,
    passingScore: 70,
    isFeatured: true,
    questions: [
      {
        questionType: "multiple-choice",
        questionText: "Choose the correct word: 'The teacher gave us a difficult ____.'",
        options: ["exam", "examination", "test", "all of the above"],
        correctAnswer: "D",
        explanation:
          "All three words (exam, examination, test) are valid in this context.",
        points: 1,
        orderIndex: 1,
        skillArea: "vocab",
      },
      {
        questionType: "multiple-choice",
        questionText: "Which word is the most formal?",
        options: ["get", "obtain", "grab", "pick up"],
        correctAnswer: "B",
        explanation: "'Obtain' is the most formal synonym.",
        points: 1,
        orderIndex: 2,
        skillArea: "vocab",
      },
      {
        questionType: "fill-blank",
        questionText:
          "Complete: 'If she had studied harder, she ____ passed the exam.'",
        options: [],
        correctAnswer: "would have",
        explanation: "Third conditional: if + past perfect, would have + past participle.",
        points: 1,
        orderIndex: 3,
        skillArea: "grammar",
      },
      {
        questionType: "true-false",
        questionText:
          "True or False: 'Bicycle' and 'bike' mean the same thing.",
        options: ["true", "false"],
        correctAnswer: "true",
        explanation: "'Bike' is a common short form of 'bicycle'.",
        points: 1,
        orderIndex: 4,
        skillArea: "vocab",
      },
      {
        questionType: "short-answer",
        questionText:
          "Read: 'Renewable energy comes from natural sources such as sunlight, wind, and water.' Name one renewable energy source mentioned.",
        options: [],
        correctAnswer: "sunlight",
        explanation:
          "Sunlight, wind, or water would all be correct answers.",
        points: 1,
        orderIndex: 5,
        skillArea: "reading",
      },
      {
        questionType: "multiple-choice",
        questionText:
          "Choose the sentence with correct grammar:",
        options: [
          "He don't like coffee.",
          "He doesn't likes coffee.",
          "He doesn't like coffee.",
          "He not like coffee.",
        ],
        correctAnswer: "C",
        explanation: "Third person singular: doesn't + base verb (like).",
        points: 1,
        orderIndex: 6,
        skillArea: "grammar",
      },
    ],
  },
];

// ─── Tutors (4) ──────────────────────────────────────────────────────

interface TutorSeed {
  slug: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  qualifications: string[];
  yearsExperience: number;
  hourlyRateUsd: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
}

const TUTORS: TutorSeed[] = [
  {
    slug: "emma-thompson",
    name: "Emma Thompson",
    bio: "Cambridge-certified English teacher with 10 years of experience preparing international students for IELTS Academic. Former British Council examiner. Specialises in Writing Task 2 and Speaking Part 3.",
    avatarUrl: null,
    specialties: ["IELTS Speaking", "IELTS Writing", "Academic English"],
    qualifications: [
      "CELTA (Cambridge Certificate in English Language Teaching to Adults)",
      "MA in Applied Linguistics, University of Edinburgh",
      "Former IELTS Examiner (British Council, 2015–2020)",
    ],
    yearsExperience: 10,
    hourlyRateUsd: 65,
    rating: 4.9,
    reviewCount: 142,
    isAvailable: true,
  },
  {
    slug: "david-okafor",
    name: "David Okafor",
    bio: "TOEFL iBT specialist with 8 years of experience tutoring students for US university admissions. Native speaker with a degree in Education from UCLA. Focuses on note-taking strategies and integrated writing.",
    avatarUrl: null,
    specialties: ["TOEFL iBT", "Academic Writing", "Note-taking"],
    qualifications: [
      "BA in Education, UCLA",
      "TOEFL iBT Certified Tutor (ETS)",
      "8 years of 1:1 TOEFL tutoring",
    ],
    yearsExperience: 8,
    hourlyRateUsd: 55,
    rating: 4.8,
    reviewCount: 98,
    isAvailable: true,
  },
  {
    slug: "priya-sharma",
    name: "Priya Sharma",
    bio: "PTE Academic expert helping students achieve 65+ scores. Specialises in speaking fluency and the describe-image task. Native speaker with a Master's in TESOL.",
    avatarUrl: null,
    specialties: ["PTE Academic", "Speaking", "Fluency"],
    qualifications: [
      "MA in TESOL, University of Melbourne",
      "PTE Academic Certified Trainer",
      "6 years teaching PTE in Australia & India",
    ],
    yearsExperience: 6,
    hourlyRateUsd: 45,
    rating: 4.7,
    reviewCount: 76,
    isAvailable: true,
  },
  {
    slug: "james-chen",
    name: "James Chen",
    bio: "GRE/GMAT Verbal tutor with a perfect 170 GRE Verbal score. Helps students master critical reasoning, reading comprehension and sentence equivalence. PhD candidate in Linguistics at Stanford.",
    avatarUrl: null,
    specialties: ["GRE Verbal", "GMAT Verbal", "Critical Reasoning"],
    qualifications: [
      "BA in Linguistics, Stanford (Honours)",
      "GRE Verbal: 170 (99th percentile)",
      "PhD candidate in Linguistics, Stanford",
    ],
    yearsExperience: 5,
    hourlyRateUsd: 80,
    rating: 5.0,
    reviewCount: 64,
    isAvailable: false,
  },
];

// ─── Resources (6) ───────────────────────────────────────────────────

interface ResourceSeed {
  slug: string;
  title: string;
  summary: string;
  description: string;
  resourceType: string;
  url: string | null;
  durationMinutes: number | null;
  readingTimeMinutes: number | null;
  level: string;
  isFeatured: boolean;
  authorName: string;
  sourceName: string;
}

const RESOURCES: ResourceSeed[] = [
  {
    slug: "ielts-band-7-strategy-guide",
    title: "How to Score Band 7+ on IELTS Academic: A Complete Strategy Guide",
    summary:
      "A 12-page strategy guide covering all 4 IELTS sections with sample answers and time-management tips.",
    description:
      "## Introduction\n\nThis guide distills 10 years of IELTS teaching experience into a 12-page strategy document. We cover:\n\n- **Reading**: skimming, scanning, True/False/Not Given strategy\n- **Listening**: predicting answers, identifying distractors\n- **Writing Task 1**: graph description templates\n- **Writing Task 2**: argumentative essay structure\n- **Speaking**: cue card preparation, Part 3 abstract questions\n\nEach section includes sample Band 7+ answers and common mistakes to avoid.",
    resourceType: "pdf",
    url: null,
    durationMinutes: null,
    readingTimeMinutes: 25,
    level: "ielts",
    isFeatured: true,
    authorName: "Emma Thompson",
    sourceName: "Alaminn.info English Learning",
  },
  {
    slug: "common-ielts-speaking-mistakes",
    title: "10 Common IELTS Speaking Mistakes (and How to Fix Them)",
    summary:
      "A video walkthrough of the 10 most common mistakes IELTS candidates make in the Speaking section.",
    description:
      "## Video Overview\n\nIn this 18-minute video, we cover the 10 most common mistakes IELTS candidates make in the Speaking section:\n\n1. Speaking too fast or too slow\n2. Using fillers (um, uh) excessively\n3. Not developing answers enough\n4. Memorising answers (examiners can tell!)\n5. Using overly formal language\n6. Mispronouncing common words\n7. Not using the full 2 minutes in Part 2\n8. Giving short Part 3 answers\n9. Self-correcting too often\n10. Not asking for clarification when needed\n\nEach mistake is illustrated with sample recordings and suggested fixes.",
    resourceType: "video",
    url: null,
    durationMinutes: 18,
    readingTimeMinutes: null,
    level: "ielts",
    isFeatured: true,
    authorName: "Emma Thompson",
    sourceName: "Alaminn.info English Learning",
  },
  {
    slug: "toefl-vs-ielts-infographic",
    title: "TOEFL vs IELTS: Which Test Should You Take? (Infographic)",
    summary:
      "A visual comparison of TOEFL iBT and IELTS Academic — format, scoring, cost, and which universities accept each.",
    description:
      "## Infographic\n\nThis infographic compares:\n\n- **Format**: TOEFL is fully computer-based; IELTS has paper and computer options, plus face-to-face Speaking.\n- **Scoring**: TOEFL 0–120; IELTS 0–9 band.\n- **Duration**: TOEFL ~3 hours; IELTS ~2h45m.\n- **Cost**: similar ($200–250 USD).\n- **Acceptance**: both widely accepted, but TOEFL is more common for US universities; IELTS for UK/EU/AU.\n\nChoose TOEFL if: applying to US/Canada, prefer computer-based, comfortable typing.\nChoose IELTS if: applying to UK/EU/AU, prefer face-to-face Speaking, stronger at handwriting.",
    resourceType: "infographic",
    url: null,
    durationMinutes: null,
    readingTimeMinutes: 5,
    level: "intermediate",
    isFeatured: false,
    authorName: "Alaminn.info Editorial",
    sourceName: "Alaminn.info English Learning",
  },
  {
    slug: "500-academic-vocabulary-list",
    title: "500 Must-Know Academic Vocabulary Words",
    summary:
      "A curated list of 500 high-frequency academic words with definitions, examples and pronunciation.",
    description:
      "## 500 Academic Words\n\nThis list is organised by frequency in academic texts (based on the Academic Word List by Averil Coxhead).\n\n### Sample (first 20 words)\n\n1. **analyse** — examine in detail\n2. **approach** — method\n3. **area** — field of study\n4. **assessment** — evaluation\n5. **assume** — take as true without proof\n6. **authority** — power or right\n7. **available** — accessible\n8. **benefit** — advantage\n9. **concept** — abstract idea\n10. **consist** — be made up of\n\n…plus 490 more in the full PDF.",
    resourceType: "pdf",
    url: null,
    durationMinutes: null,
    readingTimeMinutes: 30,
    level: "intermediate",
    isFeatured: false,
    authorName: "Alaminn.info Editorial",
    sourceName: "Alaminn.info English Learning",
  },
  {
    slug: "english-grammar-cheatsheet",
    title: "English Grammar Cheatsheet (A1–C2)",
    summary:
      "A 2-page printable cheatsheet covering all major English grammar points from beginner to advanced.",
    description:
      "## Cheatsheet Contents\n\n### Beginner (A1–A2)\n- Present, past, future simple\n- Articles (a, an, the)\n- Plurals\n- Question forms\n- Common modal verbs (can, must, should)\n\n### Intermediate (B1–B2)\n- Present perfect, past perfect\n- 1st, 2nd, 3rd conditionals\n- Reported speech\n- Passive voice\n- Relative clauses\n\n### Advanced (C1–C2)\n- Inversion\n- Cleft sentences\n- Subjunctive mood\n- Mixed conditionals\n- Advanced collocations",
    resourceType: "pdf",
    url: null,
    durationMinutes: null,
    readingTimeMinutes: 10,
    level: "beginner",
    isFeatured: true,
    authorName: "Alaminn.info Editorial",
    sourceName: "Alaminn.info English Learning",
  },
  {
    slug: "english-podcast-academic-listening",
    title: "Academic Listening Practice Podcast (Episode 1)",
    summary:
      "A 25-minute podcast episode with a 5-minute academic lecture and comprehension questions.",
    description:
      "## Podcast Episode 1\n\n**Topic**: The Science of Climate Change\n**Speaker**: Dr. Sarah Chen, Climate Scientist\n**Duration**: 25 minutes\n\nThis episode includes:\n\n- A 5-minute academic lecture on climate science\n- Comprehension questions (multiple choice)\n- Vocabulary highlights\n- Transcript with key terms underlined\n\nIdeal for IELTS/TOEFL Listening practice at CEFR B2–C1.",
    resourceType: "audio",
    url: null,
    durationMinutes: 25,
    readingTimeMinutes: null,
    level: "advanced",
    isFeatured: false,
    authorName: "Dr. Sarah Chen",
    sourceName: "Alaminn.info English Learning",
  },
];

// ─── Seeder ──────────────────────────────────────────────────────────

export async function seedEnglishLearning(): Promise<void> {
  console.log("  Seeding English Learning platform...");

  // Courses + lessons
  for (const c of COURSES) {
    const created = await db.englishLearningCourse.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        description: c.description,
        level: c.level,
        durationWeeks: c.durationWeeks,
        hoursPerWeek: c.hoursPerWeek,
        priceUsd: c.priceUsd,
        isFeatured: c.isFeatured,
        isPublished: true,
        verificationStatus: "verified",
        publicationStatus: "published",
        lastVerifiedAt: new Date(),
        certificationType: c.certificationType,
        passScore: c.passScore,
        syllabus: c.syllabus,
        prerequisites: c.prerequisites,
        targetAudience: c.targetAudience,
        learningOutcomes: c.learningOutcomes,
        tags: c.tags,
        keywords: c.tags,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        level: c.level,
        durationWeeks: c.durationWeeks,
        hoursPerWeek: c.hoursPerWeek,
        priceUsd: c.priceUsd,
        isFeatured: c.isFeatured,
        isPublished: true,
        verificationStatus: "verified",
        publicationStatus: "published",
        lastVerifiedAt: new Date(),
        certificationType: c.certificationType,
        passScore: c.passScore,
        syllabus: c.syllabus,
        prerequisites: c.prerequisites,
        targetAudience: c.targetAudience,
        learningOutcomes: c.learningOutcomes,
        tags: c.tags,
        keywords: c.tags,
      },
    });

    // Lessons
    const lessons = LESSONS_BY_COURSE[c.slug] ?? [];
    for (const l of lessons) {
      await db.englishLearningLesson.upsert({
        where: { slug: l.slug },
        update: {
          courseId: created.id,
          title: l.title,
          summary: l.summary,
          content: l.content,
          orderIndex: l.orderIndex,
          durationMinutes: l.durationMinutes,
          lessonType: l.lessonType,
          isFreePreview: l.isFreePreview,
          isPublished: true,
        },
        create: {
          slug: l.slug,
          courseId: created.id,
          title: l.title,
          summary: l.summary,
          content: l.content,
          orderIndex: l.orderIndex,
          durationMinutes: l.durationMinutes,
          lessonType: l.lessonType,
          isFreePreview: l.isFreePreview,
          isPublished: true,
        },
      });
    }
  }
  console.log(`    ✓ ${COURSES.length} courses + lessons seeded`);

  // Practice tests + questions
  for (const t of PRACTICE_TESTS) {
    const created = await db.englishLearningPracticeTest.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        description: t.description,
        testType: t.testType,
        level: t.level,
        durationMinutes: t.durationMinutes,
        totalQuestions: t.questions.length,
        passingScore: t.passingScore,
        isPublished: true,
        isFeatured: t.isFeatured,
      },
      create: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        testType: t.testType,
        level: t.level,
        durationMinutes: t.durationMinutes,
        totalQuestions: t.questions.length,
        passingScore: t.passingScore,
        isPublished: true,
        isFeatured: t.isFeatured,
      },
    });

    // Delete existing questions then re-create (simpler than upsert-by-id).
    await db.englishLearningQuestion.deleteMany({
      where: { testId: created.id },
    });
    for (const q of t.questions) {
      await db.englishLearningQuestion.create({
        data: {
          testId: created.id,
          questionType: q.questionType,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          orderIndex: q.orderIndex,
          skillArea: q.skillArea,
        },
      });
    }
  }
  console.log(
    `    ✓ ${PRACTICE_TESTS.length} practice tests + ${PRACTICE_TESTS.reduce(
      (a, t) => a + t.questions.length,
      0,
    )} questions seeded`,
  );

  // Tutors
  for (const t of TUTORS) {
    await db.englishLearningTutor.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        bio: t.bio,
        avatarUrl: t.avatarUrl,
        specialties: t.specialties,
        qualifications: t.qualifications,
        yearsExperience: t.yearsExperience,
        hourlyRateUsd: t.hourlyRateUsd,
        rating: t.rating,
        reviewCount: t.reviewCount,
        isAvailable: t.isAvailable,
        isPublished: true,
        verificationStatus: "verified",
        lastVerifiedAt: new Date(),
      },
      create: {
        slug: t.slug,
        name: t.name,
        bio: t.bio,
        avatarUrl: t.avatarUrl,
        specialties: t.specialties,
        qualifications: t.qualifications,
        yearsExperience: t.yearsExperience,
        hourlyRateUsd: t.hourlyRateUsd,
        rating: t.rating,
        reviewCount: t.reviewCount,
        isAvailable: t.isAvailable,
        isPublished: true,
        verificationStatus: "verified",
        lastVerifiedAt: new Date(),
      },
    });
  }
  console.log(`    ✓ ${TUTORS.length} tutors seeded`);

  // Resources
  for (const r of RESOURCES) {
    await db.englishLearningResource.upsert({
      where: { slug: r.slug },
      update: {
        title: r.title,
        summary: r.summary,
        description: r.description,
        resourceType: r.resourceType,
        url: r.url,
        durationMinutes: r.durationMinutes,
        readingTimeMinutes: r.readingTimeMinutes,
        level: r.level,
        isPublished: true,
        isFeatured: r.isFeatured,
        authorName: r.authorName,
        sourceName: r.sourceName,
      },
      create: {
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        description: r.description,
        resourceType: r.resourceType,
        url: r.url,
        durationMinutes: r.durationMinutes,
        readingTimeMinutes: r.readingTimeMinutes,
        level: r.level,
        isPublished: true,
        isFeatured: r.isFeatured,
        authorName: r.authorName,
        sourceName: r.sourceName,
      },
    });
  }
  console.log(`    ✓ ${RESOURCES.length} resources seeded`);

  // Default platform settings
  const defaultSettings: { key: string; value: string; category: string }[] = [
    { key: "el.platform.name", value: "Alaminn.info English Learning", category: "general" },
    {
      key: "el.platform.url",
      value: "https://alaminn.info/english-learning",
      category: "general",
    },
    {
      key: "el.referral.secret",
      value: process.env.ENGLISH_LEARNING_REFERRAL_SECRET || "alaminn-el-dev",
      category: "security",
    },
    {
      key: "el.featuredLevels",
      value: "beginner,intermediate,advanced,ielts",
      category: "display",
    },
  ];
  for (const s of defaultSettings) {
    await db.englishLearningSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`    ✓ ${defaultSettings.length} platform settings seeded`);

  console.log("  English Learning seed complete.");
}

// Allow running this file directly: `bun run prisma/seed-english-learning.ts`
if (require.main === module) {
  seedEnglishLearning()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
