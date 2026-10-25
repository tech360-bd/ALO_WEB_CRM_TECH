export interface TopicProblemSeed {
  id: string;
  statement: string;
  plain: string;
  evidence: string;
  question: string;
}

export interface TopicAreaSeed {
  code: string;
  discipline: 'BUSINESS' | 'ENGINEERING';
  name: string;
  subfield: string;
  summary: string;
  keywords: string[];
  problems: TopicProblemSeed[];
  theories: string[];
  methods: string[];
  dataSources: string;
  risks: string;
  ethics: string;
  contributions: string;
  searchStrategy: string;
}
