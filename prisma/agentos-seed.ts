/**
 * ALO Education AgentOS Seed Script
 * Seeds: 100 AgentDepartments, 20 AgentEngineTypes, 2,000 AgentDefinitions
 * Idempotent: uses upsert (slug/agentCode unique keys)
 * Run: npx tsx prisma/agentos-seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── 100 DEPARTMENTS ──────────────────────────────────────────────────────────
const DEPARTMENTS: Array<{
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
}> = [
  // Core Operations (10)
  { slug: "command-center", name: "Command Center & Governance", category: "Core Operations", description: "Master AI orchestration, governance, policy enforcement, and super-admin AI assistant", icon: "🛡️", color: "#0057B8" },
  { slug: "ai-engineering", name: "AI Engineering", category: "Core Operations", description: "Local and cloud AI model management, fine-tuning, deployment, and performance optimization", icon: "🤖", color: "#6366F1" },
  { slug: "memory-knowledge", name: "Memory & Knowledge Core", category: "Core Operations", description: "Vector memory, RAG pipeline, knowledge graph, and persistent agent memory management", icon: "🧠", color: "#8B5CF6" },
  { slug: "crm-automation", name: "CRM & Automation", category: "Core Operations", description: "Lead lifecycle management, contact automation, pipeline orchestration, and CRM intelligence", icon: "⚡", color: "#F59E0B" },
  { slug: "whatsapp-business", name: "WhatsApp Business", category: "Core Operations", description: "WhatsApp Cloud API integration, inbound/outbound automation, AI replies, and conversation routing", icon: "💬", color: "#25D366" },
  { slug: "api-gateway", name: "API Gateway", category: "Core Operations", description: "Unified API access layer, rate limiting, authentication, and request orchestration", icon: "🔗", color: "#06B6D4" },
  { slug: "event-bus", name: "Event Bus", category: "Core Operations", description: "Event-driven messaging backbone, pub/sub routing, and inter-service communication", icon: "📡", color: "#10B981" },
  { slug: "mcp-integration", name: "MCP Integration Layer", category: "Core Operations", description: "Model Context Protocol integration, tool registry, and external service bridging", icon: "🔌", color: "#3B82F6" },
  { slug: "workflow-orchestration", name: "Workflow Orchestration", category: "Core Operations", description: "Multi-agent workflow coordination, task queuing, dependency resolution, and execution monitoring", icon: "🔄", color: "#EC4899" },
  { slug: "enterprise-data-lake", name: "Enterprise Data Lake", category: "Core Operations", description: "Centralized data storage, ETL pipelines, data quality enforcement, and analytics foundation", icon: "🏔️", color: "#64748B" },

  // Marketing & Sales (10)
  { slug: "digital-marketing", name: "Digital Marketing", category: "Marketing & Sales", description: "Campaign strategy, digital advertising, marketing analytics, and growth automation", icon: "📊", color: "#F37021" },
  { slug: "social-media", name: "Social Media", category: "Marketing & Sales", description: "Post scheduling, engagement monitoring, social inbox management, and viral campaign execution", icon: "📱", color: "#E1306C" },
  { slug: "paid-ads", name: "Paid Ads", category: "Marketing & Sales", description: "Meta Ads, Google Ads, TikTok ads planning, execution, and ROI optimization", icon: "💰", color: "#FBBC04" },
  { slug: "content-writing", name: "Content Writing", category: "Marketing & Sales", description: "SEO-optimized copy, blog articles, social captions, email sequences, and marketing materials", icon: "✍️", color: "#059669" },
  { slug: "seo", name: "SEO", category: "Marketing & Sales", description: "Search engine optimization, keyword research, technical SEO, link building, and rank tracking", icon: "🔍", color: "#1D4ED8" },
  { slug: "email-marketing", name: "Email Marketing", category: "Marketing & Sales", description: "Email campaign automation, list segmentation, A/B testing, and deliverability optimization", icon: "📧", color: "#DC2626" },
  { slug: "brand-strategy", name: "Brand Strategy", category: "Marketing & Sales", description: "Brand positioning, visual identity management, brand guidelines enforcement, and market analysis", icon: "🎯", color: "#7C3AED" },
  { slug: "lead-generation", name: "Lead Generation", category: "Marketing & Sales", description: "Prospect identification, lead qualification, outreach automation, and conversion pipeline management", icon: "🎣", color: "#D97706" },
  { slug: "sales-operations", name: "Sales Operations", category: "Marketing & Sales", description: "Sales pipeline optimization, forecasting, CRM hygiene, and revenue intelligence", icon: "📈", color: "#065F46" },
  { slug: "customer-success", name: "Customer Success", category: "Marketing & Sales", description: "Customer onboarding, retention programs, health scoring, and expansion revenue management", icon: "🌟", color: "#B45309" },

  // Web & Tech (10)
  { slug: "website-design", name: "Website Design", category: "Web & Tech", description: "UI/UX design for web platforms, design systems, prototyping, and user research", icon: "🎨", color: "#F97316" },
  { slug: "website-development", name: "Website Development", category: "Web & Tech", description: "Next.js frontend development, component architecture, performance optimization, and web standards", icon: "💻", color: "#0066CC" },
  { slug: "software-development", name: "Software Development", category: "Web & Tech", description: "Custom application development, architecture design, code review, and technical documentation", icon: "⚙️", color: "#4F46E5" },
  { slug: "devops-security", name: "DevOps & Security", category: "Web & Tech", description: "CI/CD pipelines, infrastructure management, security hardening, and deployment automation", icon: "🔐", color: "#DC2626" },
  { slug: "data-analytics", name: "Data & Analytics", category: "Web & Tech", description: "Business intelligence dashboards, data visualization, statistical analysis, and reporting automation", icon: "📉", color: "#0891B2" },
  { slug: "mobile-development", name: "Mobile App Development", category: "Web & Tech", description: "iOS and Android application development, React Native, Flutter, and mobile UX optimization", icon: "📲", color: "#7C3AED" },
  { slug: "api-development", name: "API Development", category: "Web & Tech", description: "REST and GraphQL API engineering, documentation, versioning, and integration testing", icon: "🔧", color: "#1F2937" },
  { slug: "cloud-infrastructure", name: "Cloud Infrastructure", category: "Web & Tech", description: "AWS, GCP, and Azure resource management, cost optimization, and multi-cloud architecture", icon: "☁️", color: "#0369A1" },
  { slug: "database-engineering", name: "Database Engineering", category: "Web & Tech", description: "Database design, query optimization, indexing strategies, sharding, and data migration", icon: "🗄️", color: "#374151" },
  { slug: "qa-testing", name: "QA & Testing", category: "Web & Tech", description: "Quality assurance, test automation, bug tracking, regression testing, and release validation", icon: "✅", color: "#16A34A" },

  // Creative Studios (10)
  { slug: "avatar-video", name: "Avatar Video", category: "Creative Studios", description: "Human-like AI avatar video generation for marketing, education, and communication", icon: "🎭", color: "#9333EA" },
  { slug: "design-creative", name: "Design & Creative", category: "Creative Studios", description: "Graphic design, brand identity, marketing collateral, and visual communication", icon: "🖼️", color: "#DB2777" },
  { slug: "image-ai", name: "Image AI", category: "Creative Studios", description: "AI-powered image generation, editing, enhancement, and visual content production", icon: "🖼️", color: "#7C3AED" },
  { slug: "video-production", name: "Video Production", category: "Creative Studios", description: "Video content creation, editing, motion graphics, and multi-platform video distribution", icon: "🎬", color: "#DC2626" },
  { slug: "music-audio", name: "Song & Music", category: "Creative Studios", description: "AI music generation, background audio, jingles, and audio branding for ALO Education", icon: "🎵", color: "#059669" },
  { slug: "avatar-voice", name: "Human Avatar & Voice", category: "Creative Studios", description: "Realistic voice synthesis, avatar animation, and interactive spokesperson creation", icon: "🗣️", color: "#D97706" },
  { slug: "3d-modeling", name: "3D Modeling", category: "Creative Studios", description: "3D asset creation, AR/VR content, product visualization, and interactive 3D experiences", icon: "🧊", color: "#6366F1" },
  { slug: "animation-studio", name: "Animation Studio", category: "Creative Studios", description: "2D/3D animation production, explainer videos, character animation, and motion design", icon: "✨", color: "#F59E0B" },
  { slug: "photography-ai", name: "Photography AI", category: "Creative Studios", description: "AI photo editing, image restoration, product photography, and visual storytelling", icon: "📷", color: "#374151" },
  { slug: "creative-writing", name: "Creative Writing", category: "Creative Studios", description: "Storytelling, creative content, scriptwriting, and narrative development for ALO brand", icon: "📖", color: "#1D4ED8" },

  // Education Services (10)
  { slug: "study-academic-ai", name: "Study & Academic AI", category: "Education Services", description: "AI-powered learning support, tutoring assistance, academic content curation, and study planning", icon: "📚", color: "#0057B8" },
  { slug: "education-agency", name: "Education Agency Operations", category: "Education Services", description: "Student counseling workflows, university application processing, and international admission management", icon: "🎓", color: "#F37021" },
  { slug: "student-visa", name: "Student Visa Consultancy", category: "Education Services", description: "Student visa guidance, document checklist management, visa readiness scoring, and case tracking", icon: "🛂", color: "#DC2626" },
  { slug: "university-research", name: "University Research", category: "Education Services", description: "University programme research, course catalogue verification, and official data monitoring", icon: "🏛️", color: "#4F46E5" },
  { slug: "lms-course", name: "LMS & Course Management", category: "Education Services", description: "Learning management system operations, course creation, content delivery, and enrollment management", icon: "📝", color: "#059669" },
  { slug: "exam-assessment", name: "Exam & Assessment", category: "Education Services", description: "Mock exam creation, assessment design, result processing, and performance analytics", icon: "📋", color: "#D97706" },
  { slug: "curriculum-design", name: "Curriculum Design", category: "Education Services", description: "Educational curriculum development, learning outcome design, and pedagogical framework creation", icon: "🗂️", color: "#7C3AED" },
  { slug: "tutoring-ai", name: "Tutoring AI", category: "Education Services", description: "Personalized AI tutoring sessions, adaptive learning paths, and knowledge gap identification", icon: "🧑‍🏫", color: "#0891B2" },
  { slug: "academic-research", name: "Academic Research", category: "Education Services", description: "Research paper analysis, citation management, literature review, and academic writing support", icon: "🔬", color: "#374151" },
  { slug: "student-analytics", name: "Student Performance Analytics", category: "Education Services", description: "Student progress tracking, performance insights, dropout prediction, and intervention recommendations", icon: "📊", color: "#B45309" },

  // Business Operations (10)
  { slug: "finance-accounting", name: "Finance & Accounting", category: "Business Operations", description: "Financial reporting, invoice management, payment processing, commission calculation, and budget tracking", icon: "💳", color: "#065F46" },
  { slug: "hr-management", name: "HR Management", category: "Business Operations", description: "Employee lifecycle management, recruitment, onboarding, performance reviews, and HR policy enforcement", icon: "👥", color: "#1D4ED8" },
  { slug: "payroll", name: "Payroll & Benefits", category: "Business Operations", description: "Salary processing, payroll compliance, benefits administration, and compensation analytics", icon: "💰", color: "#D97706" },
  { slug: "leave-attendance", name: "Leave & Attendance", category: "Business Operations", description: "Leave request management, attendance tracking, shift scheduling, and workforce optimization", icon: "📅", color: "#7C3AED" },
  { slug: "recruitment", name: "Recruitment & Hiring", category: "Business Operations", description: "Job posting, candidate screening, interview scheduling, offer management, and talent pipeline", icon: "🤝", color: "#059669" },
  { slug: "performance-management", name: "Performance Management", category: "Business Operations", description: "KPI tracking, performance reviews, goal setting, 360-degree feedback, and employee development", icon: "📈", color: "#DC2626" },
  { slug: "legal-compliance", name: "Legal & Compliance", category: "Business Operations", description: "Regulatory compliance monitoring, contract management, policy updates, and risk assessment", icon: "⚖️", color: "#374151" },
  { slug: "procurement", name: "Procurement & Vendor", category: "Business Operations", description: "Vendor management, purchase order processing, supplier evaluation, and contract negotiation support", icon: "🛒", color: "#6366F1" },
  { slug: "office-management", name: "Office & Facilities", category: "Business Operations", description: "Office resource management, facilities coordination, asset tracking, and workplace optimization", icon: "🏢", color: "#0369A1" },
  { slug: "executive-reporting", name: "Executive Reporting", category: "Business Operations", description: "Board-level reporting, executive dashboards, strategic KPI tracking, and business intelligence", icon: "📋", color: "#B45309" },

  // Specialized Services (10)
  { slug: "partner-management", name: "Partner Network Management", category: "Specialized Services", description: "Partner onboarding, commission management, partner portal operations, and B2B relationship management", icon: "🤝", color: "#F37021" },
  { slug: "commission-tracking", name: "Commission & Revenue", category: "Specialized Services", description: "Commission calculation, revenue attribution, partner payout processing, and financial reconciliation", icon: "💎", color: "#059669" },
  { slug: "document-intelligence", name: "Document Intelligence", category: "Specialized Services", description: "Document classification, OCR extraction, authenticity verification, and intelligent document routing", icon: "📄", color: "#4F46E5" },
  { slug: "knowledge-center", name: "Knowledge Center", category: "Specialized Services", description: "Internal knowledge base management, FAQ maintenance, training material organization, and search optimization", icon: "📚", color: "#0891B2" },
  { slug: "english-test", name: "English Test & Training", category: "Specialized Services", description: "IELTS/PTE/TOEFL/Duolingo mock test delivery, AI scoring, trainer review, and improvement plans", icon: "🗣️", color: "#D97706" },
  { slug: "interview-training", name: "AI Interview Training", category: "Specialized Services", description: "University, visa, and scholarship interview preparation, AI scoring, and feedback generation", icon: "🎤", color: "#7C3AED" },
  { slug: "sop-cv-studio", name: "SOP & CV Studio", category: "Specialized Services", description: "Statement of purpose generation, CV creation, cover letter writing, and application essay editing", icon: "✍️", color: "#B45309" },
  { slug: "scholarship-matching", name: "Scholarship Matching", category: "Specialized Services", description: "Scholarship eligibility screening, application guidance, deadline tracking, and award optimization", icon: "🏆", color: "#F59E0B" },
  { slug: "course-finder", name: "Intelligent Course Finder", category: "Specialized Services", description: "AI-powered course matching, university shortlisting, eligibility checking, and comparison tools", icon: "🔍", color: "#0057B8" },
  { slug: "accommodation", name: "Accommodation Services", category: "Specialized Services", description: "Student accommodation search, booking facilitation, cost comparison, and pre-departure briefings", icon: "🏠", color: "#16A34A" },

  // Infrastructure & Security (10)
  { slug: "security-monitoring", name: "Security Monitoring", category: "Infrastructure", description: "Threat detection, intrusion prevention, vulnerability scanning, and security incident response", icon: "🔐", color: "#DC2626" },
  { slug: "audit-compliance", name: "Audit & Compliance", category: "Infrastructure", description: "Immutable audit logging, compliance reporting, regulatory monitoring, and evidence collection", icon: "🔍", color: "#374151" },
  { slug: "backup-recovery", name: "Backup & Recovery", category: "Infrastructure", description: "Automated backup scheduling, disaster recovery planning, data restoration, and business continuity", icon: "💾", color: "#6366F1" },
  { slug: "observability", name: "Observability & Monitoring", category: "Infrastructure", description: "System health monitoring, performance metrics, alerting, log aggregation, and uptime tracking", icon: "📡", color: "#0891B2" },
  { slug: "network-infrastructure", name: "Network & Infrastructure", category: "Infrastructure", description: "Network architecture, load balancing, CDN management, and infrastructure cost optimization", icon: "🌐", color: "#059669" },
  { slug: "storage-management", name: "Storage Pool Management", category: "Infrastructure", description: "Pool A/B/C storage orchestration, file routing, quota management, and storage health monitoring", icon: "🗄️", color: "#D97706" },
  { slug: "notification-engine", name: "Notification Engine", category: "Infrastructure", description: "Multi-channel notification delivery (email, SMS, WhatsApp, push), preference management, and analytics", icon: "🔔", color: "#F59E0B" },
  { slug: "identity-rbac", name: "Identity & RBAC", category: "Infrastructure", description: "Role-based access control, permission management, SSO integration, and identity governance", icon: "👤", color: "#7C3AED" },
  { slug: "cron-scheduler", name: "Cron & Scheduler", category: "Infrastructure", description: "Scheduled job management, cron expression management, job monitoring, and retry logic", icon: "⏰", color: "#B45309" },
  { slug: "cdn-performance", name: "CDN & Performance", category: "Infrastructure", description: "Content delivery optimization, image compression, caching strategies, and page speed improvement", icon: "⚡", color: "#F37021" },

  // Innovation & R&D (10)
  { slug: "ai-research-lab", name: "AI Research Lab", category: "Innovation & R&D", description: "Emerging AI technology research, model evaluation, prompt engineering, and AI capability expansion", icon: "🔬", color: "#4F46E5" },
  { slug: "product-innovation", name: "Product Innovation", category: "Innovation & R&D", description: "New feature ideation, product roadmap development, innovation sprints, and competitive intelligence", icon: "💡", color: "#F59E0B" },
  { slug: "data-science", name: "Data Science & ML", category: "Innovation & R&D", description: "Machine learning model development, predictive analytics, recommendation systems, and data science pipelines", icon: "🧮", color: "#6366F1" },
  { slug: "automation-lab", name: "Automation Lab", category: "Innovation & R&D", description: "Robotic process automation, workflow automation research, n8n integration, and process optimization", icon: "🤖", color: "#059669" },
  { slug: "nlp-language", name: "NLP & Language AI", category: "Innovation & R&D", description: "Natural language processing, multilingual support, translation services, and language model fine-tuning", icon: "🌐", color: "#0891B2" },
  { slug: "computer-vision", name: "Computer Vision", category: "Innovation & R&D", description: "Image recognition, document scanning, biometric verification, and visual intelligence applications", icon: "👁️", color: "#DC2626" },
  { slug: "blockchain-web3", name: "Blockchain & Credentials", category: "Innovation & R&D", description: "Digital credential verification, blockchain-based certificates, and distributed identity management", icon: "⛓️", color: "#D97706" },
  { slug: "iot-devices", name: "IoT & Smart Devices", category: "Innovation & R&D", description: "IoT device integration, smart office automation, attendance biometrics, and sensor data processing", icon: "📟", color: "#374151" },
  { slug: "voice-conversational", name: "Voice & Conversational AI", category: "Innovation & R&D", description: "Voice interface development, conversational AI, speech-to-text, and multi-modal interaction design", icon: "🎙️", color: "#7C3AED" },
  { slug: "ar-vr-metaverse", name: "AR/VR & Metaverse", category: "Innovation & R&D", description: "Augmented reality experiences, virtual campus tours, VR interview simulation, and immersive learning", icon: "🥽", color: "#B45309" },
];

// ─── 20 ENGINE TYPES ──────────────────────────────────────────────────────────
const ENGINE_TYPES: Array<{
  slug: string;
  name: string;
  provider: string;
  modelId: string;
  fallbackModelId: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  costPerCall: number;
}> = [
  { slug: "text-fast", name: "Fast Text Engine", provider: "zai", modelId: "glm-4-flash", fallbackModelId: "glm-4-flash", description: "High-speed text generation for real-time responses, chat, and quick tasks", capabilities: ["text_generation", "chat", "summarization"], maxTokens: 4096, supportsTools: false, supportsStreaming: true, costPerCall: 0.001 },
  { slug: "text-reasoning", name: "Deep Reasoning Engine", provider: "zai", modelId: "glm-4-plus", fallbackModelId: "glm-4-flash", description: "Advanced reasoning for complex analysis, decision-making, and multi-step problem solving", capabilities: ["reasoning", "analysis", "planning", "code_generation"], maxTokens: 32768, supportsTools: true, supportsStreaming: true, costPerCall: 0.01 },
  { slug: "code-generation", name: "Code Generation Engine", provider: "zai", modelId: "codegeex-4", fallbackModelId: "glm-4-flash", description: "Specialized code generation, review, debugging, and technical documentation", capabilities: ["code_generation", "code_review", "debugging", "refactoring"], maxTokens: 16384, supportsTools: true, supportsStreaming: true, costPerCall: 0.005 },
  { slug: "document-analysis", name: "Document Analysis Engine", provider: "zai", modelId: "glm-4-long", fallbackModelId: "glm-4-plus", description: "Long-context document processing, extraction, classification, and structured data output", capabilities: ["document_analysis", "extraction", "classification", "summarization"], maxTokens: 131072, supportsTools: false, supportsStreaming: false, costPerCall: 0.02 },
  { slug: "image-generation", name: "Image Generation Engine", provider: "zai", modelId: "cogview-3-flash", fallbackModelId: "cogview-3", description: "AI image generation for marketing materials, social content, and educational visuals", capabilities: ["image_generation", "image_editing", "style_transfer"], maxTokens: 1024, supportsTools: false, supportsStreaming: false, costPerCall: 0.04 },
  { slug: "video-generation", name: "Video Generation Engine", provider: "zai", modelId: "cogvideox-flash", fallbackModelId: "cogvideox", description: "Short-form AI video generation for social media, explainer content, and marketing campaigns", capabilities: ["video_generation", "animation", "avatar_video"], maxTokens: 512, supportsTools: false, supportsStreaming: false, costPerCall: 0.15 },
  { slug: "voice-synthesis", name: "Voice Synthesis Engine", provider: "zai", modelId: "charglm-3", fallbackModelId: "glm-4-flash", description: "Text-to-speech synthesis with multiple voice profiles and language support", capabilities: ["text_to_speech", "voice_cloning", "multilingual_tts"], maxTokens: 2048, supportsTools: false, supportsStreaming: true, costPerCall: 0.003 },
  { slug: "embedding", name: "Embedding Engine", provider: "zai", modelId: "embedding-3", fallbackModelId: "embedding-2", description: "Vector embeddings for semantic search, similarity matching, and knowledge retrieval", capabilities: ["embedding", "semantic_search", "similarity"], maxTokens: 8192, supportsTools: false, supportsStreaming: false, costPerCall: 0.0001 },
  { slug: "multimodal", name: "Multimodal Engine", provider: "zai", modelId: "glm-4v-plus", fallbackModelId: "glm-4v", description: "Vision + language processing for document OCR, image analysis, and visual QA", capabilities: ["image_understanding", "ocr", "visual_qa", "document_scan"], maxTokens: 8192, supportsTools: true, supportsStreaming: false, costPerCall: 0.025 },
  { slug: "tool-calling", name: "Tool Calling Engine", provider: "zai", modelId: "glm-4-alltools", fallbackModelId: "glm-4-plus", description: "Function calling engine for structured API interactions, database operations, and tool orchestration", capabilities: ["tool_calling", "function_execution", "api_integration", "workflow_automation"], maxTokens: 16384, supportsTools: true, supportsStreaming: true, costPerCall: 0.012 },
  { slug: "creative-writing", name: "Creative Writing Engine", provider: "zai", modelId: "characterglm", fallbackModelId: "glm-4-flash", description: "Creative content generation including stories, marketing copy, SOPs, CVs, and persuasive writing", capabilities: ["creative_writing", "sop_generation", "cv_writing", "copywriting"], maxTokens: 8192, supportsTools: false, supportsStreaming: true, costPerCall: 0.008 },
  { slug: "translation", name: "Translation Engine", provider: "zai", modelId: "glm-4-flash", fallbackModelId: "glm-4-flash", description: "Multi-language translation for Bangla, English, Arabic, Chinese, and 50+ languages", capabilities: ["translation", "localization", "language_detection"], maxTokens: 4096, supportsTools: false, supportsStreaming: false, costPerCall: 0.002 },
  { slug: "classification", name: "Classification Engine", provider: "zai", modelId: "glm-4-flash", fallbackModelId: "glm-4-flash", description: "Zero-shot and few-shot classification for leads, documents, intents, and categories", capabilities: ["classification", "intent_detection", "entity_recognition", "labeling"], maxTokens: 2048, supportsTools: false, supportsStreaming: false, costPerCall: 0.0015 },
  { slug: "data-extraction", name: "Data Extraction Engine", provider: "zai", modelId: "glm-4-plus", fallbackModelId: "glm-4-flash", description: "Structured data extraction from unstructured text, PDFs, and web pages", capabilities: ["extraction", "structured_output", "form_parsing", "data_normalization"], maxTokens: 8192, supportsTools: true, supportsStreaming: false, costPerCall: 0.008 },
  { slug: "web-search", name: "Web Search & Research Engine", provider: "zai", modelId: "glm-4-alltools", fallbackModelId: "glm-4-plus", description: "Real-time web search, URL analysis, fact verification, and online research automation", capabilities: ["web_search", "url_analysis", "fact_checking", "research"], maxTokens: 16384, supportsTools: true, supportsStreaming: false, costPerCall: 0.015 },
  { slug: "sentiment-analysis", name: "Sentiment Analysis Engine", provider: "zai", modelId: "glm-4-flash", fallbackModelId: "glm-4-flash", description: "Sentiment detection, emotion analysis, tone classification, and brand perception monitoring", capabilities: ["sentiment_analysis", "emotion_detection", "tone_analysis"], maxTokens: 2048, supportsTools: false, supportsStreaming: false, costPerCall: 0.001 },
  { slug: "question-answering", name: "Q&A Engine", provider: "zai", modelId: "glm-4-long", fallbackModelId: "glm-4-plus", description: "Knowledge-grounded question answering with citation support and source attribution", capabilities: ["question_answering", "knowledge_retrieval", "citation", "fact_qa"], maxTokens: 32768, supportsTools: true, supportsStreaming: true, costPerCall: 0.01 },
  { slug: "chat-agent", name: "Conversational Agent Engine", provider: "zai", modelId: "glm-4-flash", fallbackModelId: "glm-4-flash", description: "Multi-turn conversational AI with memory integration for student support, counseling, and general inquiries", capabilities: ["multi_turn_chat", "memory", "persona", "context_management"], maxTokens: 8192, supportsTools: false, supportsStreaming: true, costPerCall: 0.002 },
  { slug: "sql-agent", name: "SQL & Database Agent Engine", provider: "zai", modelId: "glm-4-plus", fallbackModelId: "glm-4-flash", description: "Natural language to SQL conversion, database query generation, and data analysis automation", capabilities: ["text_to_sql", "database_query", "data_analysis", "reporting"], maxTokens: 8192, supportsTools: true, supportsStreaming: false, costPerCall: 0.01 },
  { slug: "evaluation", name: "AI Evaluation & QA Engine", provider: "zai", modelId: "glm-4-plus", fallbackModelId: "glm-4-flash", description: "Output quality scoring, factual accuracy checking, bias detection, and AI response evaluation", capabilities: ["evaluation", "quality_scoring", "bias_detection", "fact_checking"], maxTokens: 8192, supportsTools: false, supportsStreaming: false, costPerCall: 0.008 },
];

// ─── AGENT ROLE TEMPLATES (20 agents × 100 departments = 2,000) ──────────────
type AgentRole = {
  role: string;
  description: string;
  capabilities: string[];
  engineSlug: string;
  requiresApproval: boolean;
  permissionScope: string;
  tags: string[];
};

function buildAgentRoles(deptName: string, deptSlug: string): AgentRole[] {
  const clean = deptName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  return [
    {
      role: "Manager Agent",
      description: `Orchestrates all ${clean} workflows, delegates tasks to specialist agents, monitors KPIs, and reports to Command Center`,
      capabilities: ["orchestration", "monitoring", "delegation", "reporting"],
      engineSlug: "tool-calling",
      requiresApproval: true,
      permissionScope: "department",
      tags: ["manager", "orchestrator", deptSlug],
    },
    {
      role: "Planner Agent",
      description: `Analyzes ${clean} objectives, creates execution plans, identifies resource requirements, and schedules task sequences`,
      capabilities: ["planning", "analysis", "scheduling"],
      engineSlug: "text-reasoning",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["planner", deptSlug],
    },
    {
      role: "Research Agent",
      description: `Gathers intelligence relevant to ${clean}, monitors industry trends, sources verified data, and maintains knowledge currency`,
      capabilities: ["research", "data_gathering", "web_search"],
      engineSlug: "web-search",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["research", deptSlug],
    },
    {
      role: "Content Creator Agent",
      description: `Produces high-quality written and visual content for ${clean} initiatives including reports, summaries, and communication materials`,
      capabilities: ["content_creation", "writing", "summarization"],
      engineSlug: "creative-writing",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["content", "creator", deptSlug],
    },
    {
      role: "Data Analyst Agent",
      description: `Processes ${clean} data, generates analytical reports, identifies patterns, and surfaces actionable insights for decision-makers`,
      capabilities: ["data_analysis", "reporting", "visualization"],
      engineSlug: "sql-agent",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["analyst", "data", deptSlug],
    },
    {
      role: "Automation Agent",
      description: `Executes repetitive ${clean} workflows automatically, manages batch operations, and reduces manual intervention overhead`,
      capabilities: ["automation", "batch_processing", "workflow_execution"],
      engineSlug: "tool-calling",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["automation", deptSlug],
    },
    {
      role: "Quality Assurance Agent",
      description: `Validates ${clean} outputs for accuracy, consistency, and compliance before delivery or publication`,
      capabilities: ["quality_check", "validation", "compliance"],
      engineSlug: "evaluation",
      requiresApproval: true,
      permissionScope: "department",
      tags: ["qa", "quality", deptSlug],
    },
    {
      role: "Communication Agent",
      description: `Handles all internal and external communications for ${clean} including drafting messages, notifications, and status updates`,
      capabilities: ["communication", "drafting", "notification"],
      engineSlug: "chat-agent",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["communication", deptSlug],
    },
    {
      role: "Document Processor Agent",
      description: `Processes, classifies, extracts, and routes all documents relevant to ${clean} operations with audit trail`,
      capabilities: ["document_processing", "extraction", "classification"],
      engineSlug: "document-analysis",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["document", "processor", deptSlug],
    },
    {
      role: "Classifier Agent",
      description: `Categorizes inputs, leads, requests, and items entering the ${clean} pipeline using intent and entity detection`,
      capabilities: ["classification", "intent_detection", "routing"],
      engineSlug: "classification",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["classifier", deptSlug],
    },
    {
      role: "Monitor Agent",
      description: `Continuously monitors ${clean} health metrics, SLA compliance, error rates, and system anomalies with real-time alerting`,
      capabilities: ["monitoring", "alerting", "health_check"],
      engineSlug: "text-fast",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["monitor", "health", deptSlug],
    },
    {
      role: "Optimizer Agent",
      description: `Identifies performance bottlenecks in ${clean} processes, recommends improvements, and implements approved optimizations`,
      capabilities: ["optimization", "performance_tuning", "recommendations"],
      engineSlug: "text-reasoning",
      requiresApproval: true,
      permissionScope: "department",
      tags: ["optimizer", deptSlug],
    },
    {
      role: "Translator Agent",
      description: `Provides multilingual translation and localization support for ${clean} content across Bangla, English, and other target languages`,
      capabilities: ["translation", "localization"],
      engineSlug: "translation",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["translator", "multilingual", deptSlug],
    },
    {
      role: "Embedding & Search Agent",
      description: `Indexes ${clean} knowledge base content, enables semantic search, and serves relevant context to other agents via RAG`,
      capabilities: ["embedding", "semantic_search", "rag"],
      engineSlug: "embedding",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["search", "embedding", deptSlug],
    },
    {
      role: "Extractor Agent",
      description: `Extracts structured data from ${clean}-related inputs including forms, documents, emails, and web sources`,
      capabilities: ["data_extraction", "structured_output"],
      engineSlug: "data-extraction",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["extractor", deptSlug],
    },
    {
      role: "Evaluator Agent",
      description: `Scores and evaluates ${clean} outputs for quality, accuracy, and alignment with ALO Education standards before deployment`,
      capabilities: ["evaluation", "scoring", "quality_assessment"],
      engineSlug: "evaluation",
      requiresApproval: true,
      permissionScope: "department",
      tags: ["evaluator", deptSlug],
    },
    {
      role: "Escalation Agent",
      description: `Detects ${clean} situations requiring human judgment, routes to appropriate staff, and manages the human-in-the-loop workflow`,
      capabilities: ["escalation", "human_handoff", "priority_routing"],
      engineSlug: "text-fast",
      requiresApproval: true,
      permissionScope: "department",
      tags: ["escalation", "handoff", deptSlug],
    },
    {
      role: "Audit & Compliance Agent",
      description: `Maintains immutable audit records for all ${clean} agent actions, validates compliance, and generates regulatory reports`,
      capabilities: ["audit_logging", "compliance_check", "reporting"],
      engineSlug: "text-fast",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["audit", "compliance", deptSlug],
    },
    {
      role: "Recovery Agent",
      description: `Detects and recovers from ${clean} workflow failures, executes retry logic, and implements self-healing procedures`,
      capabilities: ["error_recovery", "retry_logic", "self_healing"],
      engineSlug: "tool-calling",
      requiresApproval: false,
      permissionScope: "department",
      tags: ["recovery", "resilience", deptSlug],
    },
    {
      role: "Reporting Agent",
      description: `Generates comprehensive ${clean} reports for management, exports data in multiple formats, and distributes to relevant stakeholders`,
      capabilities: ["reporting", "data_export", "distribution"],
      engineSlug: "text-reasoning",
      requiresApproval: false,
      permissionScope: "read_only",
      tags: ["reporting", deptSlug],
    },
  ];
}

// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 ALO AgentOS Seed Starting...");
  console.log(`📦 Seeding ${DEPARTMENTS.length} departments, ${ENGINE_TYPES.length} engine types, ${DEPARTMENTS.length * 20} agents\n`);

  // 1. Upsert Engine Types
  console.log("⚙️  Seeding engine types...");
  const engineMap = new Map<string, string>(); // slug → id
  for (const engine of ENGINE_TYPES) {
    const record = await prisma.agentEngineType.upsert({
      where: { slug: engine.slug },
      update: {
        name: engine.name,
        provider: engine.provider,
        modelId: engine.modelId,
        fallbackModelId: engine.fallbackModelId,
        description: engine.description,
        capabilities: JSON.stringify(engine.capabilities),
        maxTokens: engine.maxTokens,
        supportsTools: engine.supportsTools,
        supportsStreaming: engine.supportsStreaming,
        costPerCall: engine.costPerCall,
        isActive: true,
      },
      create: {
        slug: engine.slug,
        name: engine.name,
        provider: engine.provider,
        modelId: engine.modelId,
        fallbackModelId: engine.fallbackModelId,
        description: engine.description,
        capabilities: JSON.stringify(engine.capabilities),
        maxTokens: engine.maxTokens,
        supportsTools: engine.supportsTools,
        supportsStreaming: engine.supportsStreaming,
        costPerCall: engine.costPerCall,
        isActive: true,
      },
    });
    engineMap.set(engine.slug, record.id);
  }
  console.log(`   ✅ ${ENGINE_TYPES.length} engine types seeded\n`);

  // 2. Upsert Departments + their Agents
  console.log("🏛️  Seeding departments and agents...");
  let totalAgents = 0;

  for (let dIndex = 0; dIndex < DEPARTMENTS.length; dIndex++) {
    const dept = DEPARTMENTS[dIndex];
    const sortOrder = dIndex + 1;

    // Upsert department
    const deptRecord = await prisma.agentDepartment.upsert({
      where: { slug: dept.slug },
      update: {
        name: dept.name,
        category: dept.category,
        description: dept.description,
        icon: dept.icon,
        color: dept.color,
        sortOrder,
        isActive: true,
        agentCount: 20,
      },
      create: {
        slug: dept.slug,
        name: dept.name,
        category: dept.category,
        description: dept.description,
        icon: dept.icon,
        color: dept.color,
        sortOrder,
        isActive: true,
        agentCount: 20,
      },
    });

    // Build 20 agent roles for this department
    const roles = buildAgentRoles(dept.name, dept.slug);

    for (let aIndex = 0; aIndex < roles.length; aIndex++) {
      const role = roles[aIndex];
      const agentNum = String(dIndex * 20 + aIndex + 1).padStart(4, "0");
      const agentCode = `AGT-${agentNum}`;

      const engineId = engineMap.get(role.engineSlug) ?? engineMap.get("text-fast")!;

      await prisma.agentDefinition.upsert({
        where: { agentCode },
        update: {
          name: `${dept.name} — ${role.role}`,
          departmentId: deptRecord.id,
          engineTypeId: engineId,
          description: role.description,
          systemPrompt: `You are the ${role.role} for the ${dept.name} department at ALO Education. ${role.description}. Always follow ALO Education's constitutional rules, maintain audit trails, escalate when uncertain, and request human approval for high-risk actions.`,
          capabilities: JSON.stringify(role.capabilities),
          toolsAllowed: JSON.stringify(role.capabilities),
          permissionScope: role.permissionScope,
          requiresApproval: role.requiresApproval,
          approvalThreshold: role.requiresApproval ? "always" : "high_risk",
          status: "active",
          version: "1.0.0",
          tags: JSON.stringify(role.tags),
          metadata: JSON.stringify({ department: dept.slug, category: dept.category, sortOrder: aIndex + 1 }),
          isSystem: true,
        },
        create: {
          agentCode,
          name: `${dept.name} — ${role.role}`,
          departmentId: deptRecord.id,
          engineTypeId: engineId,
          description: role.description,
          systemPrompt: `You are the ${role.role} for the ${dept.name} department at ALO Education. ${role.description}. Always follow ALO Education's constitutional rules, maintain audit trails, escalate when uncertain, and request human approval for high-risk actions.`,
          capabilities: JSON.stringify(role.capabilities),
          toolsAllowed: JSON.stringify(role.capabilities),
          permissionScope: role.permissionScope,
          requiresApproval: role.requiresApproval,
          approvalThreshold: role.requiresApproval ? "always" : "high_risk",
          status: "active",
          version: "1.0.0",
          tags: JSON.stringify(role.tags),
          metadata: JSON.stringify({ department: dept.slug, category: dept.category, sortOrder: aIndex + 1 }),
          isSystem: true,
        },
      });

      totalAgents++;
    }

    if ((dIndex + 1) % 10 === 0) {
      console.log(`   📦 Seeded dept ${dIndex + 1}/100: ${dept.name} (${totalAgents} agents total)`);
    }
  }

  // 3. Final Verification
  const deptCount = await prisma.agentDepartment.count();
  const agentCount = await prisma.agentDefinition.count();
  const engineCount = await prisma.agentEngineType.count();

  console.log("\n✅ ALO AgentOS Seed Complete!");
  console.log("═══════════════════════════════");
  console.log(`🏛️  Departments: ${deptCount}`);
  console.log(`⚙️  Engine Types: ${engineCount}`);
  console.log(`🤖 AI Agents:   ${agentCount}`);
  console.log("═══════════════════════════════");

  if (agentCount !== 2000) {
    console.warn(`⚠️  Expected 2000 agents, got ${agentCount}`);
  }
  if (deptCount !== 100) {
    console.warn(`⚠️  Expected 100 departments, got ${deptCount}`);
  }
  if (engineCount !== 20) {
    console.warn(`⚠️  Expected 20 engine types, got ${engineCount}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
