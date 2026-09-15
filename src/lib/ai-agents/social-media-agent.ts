// ============================================================
// ALO Education — Social Media AI Agent (Own AI, No SaaS)
// Uses src/lib/ai.ts generateText (Groq/ZAI/OpenRouter fallback)
// Covers all 24 platforms from social-platforms-registry.ts
// Features: content generation, reply suggestions, analytics, scheduling, inbox management
// ============================================================

import { generateText } from '@/lib/ai';
import { SOCIAL_PLATFORMS_REGISTRY, getPlatformById, type SocialPlatformDefinition } from '@/lib/social-platforms-registry';

export interface SocialContentRequest {
  platform: string; // platform id
  topic: string;
  contentType?: string; // post, story, reel, video, etc.
  tone?: string;
  targetAudience?: string;
  keywords?: string[];
  includeHashtags?: boolean;
  includeCTA?: boolean;
  language?: string;
  additionalContext?: string;
}

export interface SocialContentResponse {
  platform: string;
  content: string;
  hashtags?: string[];
  cta?: string;
  imagePrompt?: string;
  videoScript?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  estimatedReach?: string;
  bestPostingTime?: string;
  generatedAt: string;
  aiModel: string;
}

export interface SocialReplyRequest {
  platform: string;
  originalMessage: string;
  senderName?: string;
  intent?: string;
  conversationHistory?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  isLead?: boolean;
}

export interface SocialReplyResponse {
  reply: string;
  alternativeReplies?: string[];
  shouldEscalate?: boolean;
  leadScore?: number;
  intentDetected?: string;
  suggestedActions?: string[];
  generatedAt: string;
}

export interface SocialAnalyticsRequest {
  platform: string;
  metrics: {
    impressions?: number;
    engagement?: number;
    clicks?: number;
    shares?: number;
    comments?: number;
    followers?: number;
  };
  period?: string;
}

export interface SocialAnalyticsResponse {
  platform: string;
  insights: string[];
  recommendations: string[];
  performanceScore: number;
  predictedGrowth: string;
  generatedAt: string;
}

export interface SocialAgentTask {
  id: string;
  type: 'content_generation' | 'reply_suggestion' | 'analytics' | 'scheduling' | 'inbox_management' | 'trend_analysis' | 'lead_conversion';
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  createdAt: string;
  completedAt?: string;
}

// Core AI Agent Class
export class SocialMediaAIAgent {
  private model: string;
  private agentName: string = 'ALO Social Media AI Agent';
  private version: string = '2.0';

  constructor(model: string = 'glm-4-flash') {
    this.model = model;
  }

  // Generate platform-specific content using own AI
  async generateContent(request: SocialContentRequest): Promise<SocialContentResponse> {
    const platform = getPlatformById(request.platform);
    if (!platform) {
      throw new Error(`Platform ${request.platform} not found in registry`);
    }

    const systemPrompt = `You are ${this.agentName} v${this.version}, an expert social media manager for ALO Education, a study abroad consultancy in Bangladesh.

Your expertise:
- 24 platforms coverage: ${SOCIAL_PLATFORMS_REGISTRY.map(p => p.displayName).join(', ')}
- Platform: ${platform.displayName} (${platform.mau} MAU) - ${platform.bestFor}
- Content formats: ${platform.contentFormats.join(', ')}
- Best practices: ${platform.contentTips.join('; ')}
- Tone: ${platform.aiContentTone}
- ALO Use Case: ${platform.aloUseCase}

You must:
1. Generate content specifically optimized for ${platform.displayName}
2. Follow ${platform.displayName} best practices and character limits
3. Use tone: ${request.tone || platform.aiContentTone}
4. Target: ${request.targetAudience || 'Students interested in studying abroad (Bangladesh market)'}
5. Include CTA if requested: ${request.includeCTA ? 'Yes' : 'No'}
6. Include hashtags if requested: ${request.includeHashtags ? 'Yes, 5-10 relevant' : 'No'}
7. Language: ${request.language || 'English with some Bangla cultural context'}
8. Never use external SaaS, only own AI knowledge

ALO Education context: Helps Bangladeshi students study in UK, Canada, Australia, USA, Germany, etc. Services: counseling, IELTS prep, application, visa, scholarships.

Topic: ${request.topic}
Content Type: ${request.contentType || 'post'}
Keywords: ${request.keywords?.join(', ') || 'study abroad, scholarship, visa'}
Additional: ${request.additionalContext || 'None'}

Generate response in JSON format:
{
  "content": "main content",
  "hashtags": ["#hashtag1", ...],
  "cta": "call to action",
  "imagePrompt": "description for image generation",
  "videoScript": "if video content, script with scenes",
  "seoTitle": "if applicable, SEO title",
  "seoDescription": "if applicable, SEO description",
  "tags": ["tag1", ...],
  "estimatedReach": "estimated reach explanation",
  "bestPostingTime": "best time to post for this platform"
}`;

    const prompt = `${platform.aiPromptModifier}

Topic: ${request.topic}
Generate ${request.contentType || 'post'} for ${platform.displayName}.

Requirements:
- Platform: ${platform.displayName} (${platform.mau})
- Tone: ${request.tone || platform.aiContentTone}
- Audience: ${request.targetAudience || 'Bangladeshi students interested in study abroad'}
- Keywords: ${request.keywords?.join(', ') || 'study abroad'}
- CTA: ${request.includeCTA ? 'Include strong CTA' : 'No CTA needed'}
- Hashtags: ${request.includeHashtags ? 'Include 5-10 relevant hashtags' : 'No hashtags'}
- Additional context: ${request.additionalContext || ''}

Return ONLY JSON, no markdown, no explanation.`;

    try {
      const result = await generateText({
        prompt,
        systemPrompt,
        model: this.model,
        temperature: 0.8,
        maxTokens: 1000,
      });

      let parsed: any;
      try {
        // Try to extract JSON from response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: treat whole text as content
          parsed = { content: result.text };
        }
      } catch {
        parsed = { content: result.text };
      }

      return {
        platform: platform.id,
        content: parsed.content || result.text,
        hashtags: parsed.hashtags || [],
        cta: parsed.cta || '',
        imagePrompt: parsed.imagePrompt || '',
        videoScript: parsed.videoScript || '',
        seoTitle: parsed.seoTitle || '',
        seoDescription: parsed.seoDescription || '',
        tags: parsed.tags || request.keywords || [],
        estimatedReach: parsed.estimatedReach || this.estimateReach(platform),
        bestPostingTime: parsed.bestPostingTime || this.getBestPostingTime(platform),
        generatedAt: new Date().toISOString(),
        aiModel: this.model,
      };
    } catch (error: any) {
      throw new Error(`AI content generation failed for ${platform.displayName}: ${error.message}`);
    }
  }

  // Generate reply suggestion using own AI
  async generateReply(request: SocialReplyRequest): Promise<SocialReplyResponse> {
    const platform = getPlatformById(request.platform);
    if (!platform) {
      throw new Error(`Platform ${request.platform} not found`);
    }

    const systemPrompt = `You are ${this.agentName}, expert in social media customer support for ALO Education.

Platform: ${platform.displayName} - ${platform.bestFor}
Tone: ${platform.aiContentTone}
ALO Services: Study abroad counseling, IELTS, applications, visa, scholarships for UK, Canada, Australia, USA, Germany.

You must:
1. Analyze the original message for intent, sentiment, lead potential
2. Generate a helpful, professional reply optimized for ${platform.displayName}
3. Detect if should escalate to human counselor
4. Score lead potential (0-100)
5. Suggest next actions

Original message from ${request.senderName || 'user'} on ${platform.displayName}:
"${request.originalMessage}"

Intent: ${request.intent || 'unknown'}
Sentiment: ${request.sentiment || 'neutral'}
Is Lead: ${request.isLead ? 'Yes' : 'Unknown'}
History: ${request.conversationHistory?.join(' | ') || 'None'}

Generate JSON:
{
  "reply": "main reply",
  "alternativeReplies": ["alt1", "alt2"],
  "shouldEscalate": false,
  "leadScore": 75,
  "intentDetected": "visa_inquiry",
  "suggestedActions": ["action1", "action2"]
}`;

    const prompt = `Generate a reply for this ${platform.displayName} message:

From: ${request.senderName || 'User'}
Message: "${request.originalMessage}"
Intent: ${request.intent || 'unknown'}
Sentiment: ${request.sentiment || 'neutral'}

Requirements:
- Platform tone: ${platform.aiContentTone}
- Be helpful, professional, concise
- Include next step/CTA
- Detect lead potential
- Suggest if needs human escalation

Return ONLY JSON.`;

    try {
      const result = await generateText({
        prompt,
        systemPrompt,
        model: this.model,
        temperature: 0.7,
        maxTokens: 800,
      });

      let parsed: any;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = { reply: result.text };
        }
      } catch {
        parsed = { reply: result.text };
      }

      return {
        reply: parsed.reply || result.text,
        alternativeReplies: parsed.alternativeReplies || [],
        shouldEscalate: parsed.shouldEscalate || false,
        leadScore: parsed.leadScore || this.calculateLeadScore(request.originalMessage),
        intentDetected: parsed.intentDetected || request.intent || 'general_inquiry',
        suggestedActions: parsed.suggestedActions || ['Follow up in 24h', 'Add to CRM'],
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`AI reply generation failed: ${error.message}`);
    }
  }

  // Generate analytics insights using own AI
  async generateAnalytics(request: SocialAnalyticsRequest): Promise<SocialAnalyticsResponse> {
    const platform = getPlatformById(request.platform);
    if (!platform) {
      throw new Error(`Platform ${request.platform} not found`);
    }

    const systemPrompt = `You are ${this.agentName}, analytics expert for ALO Education social media.

Platform: ${platform.displayName} (${platform.mau} MAU)
Best for: ${platform.bestFor}
ALO Use Case: ${platform.aloUseCase}

Analyze metrics and provide insights, recommendations, performance score, and growth prediction.

Metrics: ${JSON.stringify(request.metrics)}
Period: ${request.period || 'Last 30 days'}

Generate JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "performanceScore": 85,
  "predictedGrowth": "15% growth expected if..."
}`;

    const prompt = `Analyze ${platform.displayName} metrics:

${JSON.stringify(request.metrics, null, 2)}
Period: ${request.period || 'Last 30 days'}

Provide insights, 3 recommendations, performance score (0-100), and growth prediction.

Return ONLY JSON.`;

    try {
      const result = await generateText({
        prompt,
        systemPrompt,
        model: this.model,
        temperature: 0.6,
        maxTokens: 800,
      });

      let parsed: any;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = {
            insights: [result.text],
            recommendations: ['Continue current strategy'],
            performanceScore: 75,
            predictedGrowth: 'Stable growth expected'
          };
        }
      } catch {
        parsed = {
          insights: [result.text],
          recommendations: ['Continue current strategy'],
          performanceScore: 75,
          predictedGrowth: 'Stable growth expected'
        };
      }

      return {
        platform: platform.id,
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        performanceScore: parsed.performanceScore || 75,
        predictedGrowth: parsed.predictedGrowth || 'Stable',
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`AI analytics failed: ${error.message}`);
    }
  }

  // Generate content for all platforms at once (batch)
  async generateForAllPlatforms(topic: string, contentType: string = 'post'): Promise<SocialContentResponse[]> {
    const results: SocialContentResponse[] = [];
    
    // Generate for critical + high priority first (12 platforms)
    const priorityPlatforms = SOCIAL_PLATFORMS_REGISTRY.filter(p => p.priority === 'critical' || p.priority === 'high');
    
    for (const platform of priorityPlatforms) {
      try {
        const result = await this.generateContent({
          platform: platform.id,
          topic,
          contentType,
          includeHashtags: true,
          includeCTA: true,
        });
        results.push(result);
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to generate for ${platform.displayName}:`, error);
        // Continue with other platforms
      }
    }

    return results;
  }

  // Trend analysis using AI
  async analyzeTrends(platform: string, recentPosts: string[]): Promise<string[]> {
    const platformDef = getPlatformById(platform);
    if (!platformDef) throw new Error(`Platform ${platform} not found`);

    const systemPrompt = `You are ${this.agentName}, trend analyst for ${platformDef.displayName}.

Analyze recent posts and identify trends, hot topics, and content opportunities for ALO Education (study abroad).

Recent posts: ${recentPosts.slice(0, 10).join(' | ')}

Return JSON array of 5 trending topics/opportunities.`;

    const prompt = `Analyze trends for ${platformDef.displayName} from these recent posts:

${recentPosts.slice(0, 10).join('\n')}

Identify 5 trending topics or content opportunities for study abroad consultancy.

Return ONLY JSON array: ["trend1", "trend2", ...]`;

    try {
      const result = await generateText({
        prompt,
        systemPrompt,
        model: this.model,
        temperature: 0.7,
        maxTokens: 500,
      });

      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return result.text.split('\n').filter(t => t.trim()).slice(0, 5);
      } catch {
        return result.text.split('\n').filter(t => t.trim()).slice(0, 5);
      }
    } catch (error: any) {
      throw new Error(`Trend analysis failed: ${error.message}`);
    }
  }

  // Helper: estimate reach
  private estimateReach(platform: SocialPlatformDefinition): string {
    const baseReach = Math.floor(platform.mauNumeric * 0.0001); // 0.01% of MAU
    return `Estimated ${baseReach.toLocaleString()} - ${(baseReach * 3).toLocaleString()} reach with good engagement`;
  }

  // Helper: best posting time
  private getBestPostingTime(platform: SocialPlatformDefinition): string {
    const times: Record<string, string> = {
      facebook: 'Tue-Thu 9AM-1PM BD Time (Asia/Dhaka)',
      instagram: 'Mon-Fri 11AM-2PM BD Time, Stories daily 8AM-10PM',
      whatsapp: 'Daily 10AM-8PM BD Time, avoid late night',
      youtube: 'Fri-Sun 2PM-4PM BD Time, Shorts daily 12PM-3PM',
      tiktok: 'Tue-Thu 7PM-11PM BD Time, 1-3 posts daily',
      linkedin: 'Tue-Thu 9AM-12PM BD Time, professional hours',
      x_twitter: 'Mon-Fri 9AM-3PM BD Time, real-time engagement',
      // Default
      default: 'Tue-Thu 10AM-2PM BD Time (Asia/Dhaka) for best engagement'
    };
    return times[platform.id] || times.default;
  }

  // Helper: lead scoring
  private calculateLeadScore(message: string): number {
    const lower = message.toLowerCase();
    let score = 30; // base

    const highIntentKeywords = ['apply', 'admission', 'visa', 'ielts', 'scholarship', 'study', 'university', 'course', 'cost', 'requirements'];
    const mediumIntentKeywords = ['information', 'details', 'help', 'guide', 'process', 'when', 'how'];
    
    highIntentKeywords.forEach(kw => {
      if (lower.includes(kw)) score += 10;
    });
    
    mediumIntentKeywords.forEach(kw => {
      if (lower.includes(kw)) score += 5;
    });

    if (lower.includes('?')) score += 5; // question indicates interest
    if (lower.length > 50) score += 10; // detailed message

    return Math.min(100, score);
  }

  // Get agent info
  getAgentInfo() {
    return {
      name: this.agentName,
      version: this.version,
      model: this.model,
      platformsSupported: SOCIAL_PLATFORMS_REGISTRY.length,
      totalMAU: SOCIAL_PLATFORMS_REGISTRY.reduce((sum, p) => sum + p.mauNumeric, 0),
      capabilities: [
        'Content generation for 24 platforms',
        'Reply suggestions with lead scoring',
        'Analytics insights and recommendations',
        'Trend analysis',
        'Batch generation for all platforms',
        'Own AI — no external SaaS',
        'Uses Groq/ZAI/OpenRouter fallback',
        'Platform-specific optimization'
      ],
      platforms: SOCIAL_PLATFORMS_REGISTRY.map(p => ({
        id: p.id,
        name: p.displayName,
        mau: p.mau,
        priority: p.priority,
        category: p.category
      }))
    };
  }
}

// Singleton instance
let socialAgentInstance: SocialMediaAIAgent | null = null;

export function getSocialMediaAgent(model?: string): SocialMediaAIAgent {
  if (!socialAgentInstance) {
    socialAgentInstance = new SocialMediaAIAgent(model);
  }
  if (model && socialAgentInstance) {
    // Update model if provided
    (socialAgentInstance as any).model = model;
  }
  return socialAgentInstance;
}

// Quick helper functions
export async function generateSocialContent(request: SocialContentRequest): Promise<SocialContentResponse> {
  const agent = getSocialMediaAgent();
  return agent.generateContent(request);
}

export async function generateSocialReply(request: SocialReplyRequest): Promise<SocialReplyResponse> {
  const agent = getSocialMediaAgent();
  return agent.generateReply(request);
}

export async function generateSocialAnalytics(request: SocialAnalyticsRequest): Promise<SocialAnalyticsResponse> {
  const agent = getSocialMediaAgent();
  return agent.generateAnalytics(request);
}
