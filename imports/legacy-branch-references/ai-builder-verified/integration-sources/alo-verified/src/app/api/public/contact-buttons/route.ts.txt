import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Returns the 3 communication logos config (public).
 * - AI Agent
 * - WhatsApp AI Agent (01805020100)
 * - Facebook
 *
 * Public GET — no auth.
 */
export async function GET() {
  try {
    // Pull configured brand assets (logos) — fall back to defaults if not seeded
    const logoAssets = await db.brandAsset.findMany({
      where: {
        status: 'active',
        OR: [
          { assetType: 'logo' },
          { assetType: 'communication_logo' },
          { name: { contains: 'ai_agent' } },
          { name: { contains: 'whatsapp' } },
          { name: { contains: 'facebook' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const findLogo = (predicate: (a: typeof logoAssets[number]) => boolean) =>
      logoAssets.find(predicate)?.fileUrl || null;

    const aiAgentLogo = findLogo(
      (a) =>
        a.name?.toLowerCase().includes('ai') ||
        a.name?.toLowerCase().includes('agent')
    );

    const whatsappLogo = findLogo(
      (a) => a.name?.toLowerCase().includes('whatsapp')
    );

    const facebookLogo = findLogo(
      (a) => a.name?.toLowerCase().includes('facebook')
    );

    const buttons = [
      {
        id: 'ai_agent',
        label: 'AI Agent',
        type: 'ai_chat',
        href: '/api/public/chat',
        icon: 'ai',
        logoUrl: aiAgentLogo,
        enabled: true,
        description: 'Chat with our AI assistant 24/7 for instant answers.',
      },
      {
        id: 'whatsapp_ai_agent',
        label: 'WhatsApp AI Agent',
        type: 'whatsapp',
        href: 'https://wa.me/8801805020100',
        phoneNumber: '+8801805020100',
        displayNumber: '01805020100',
        icon: 'whatsapp',
        logoUrl: whatsappLogo,
        enabled: true,
        description: 'Chat with our AI-powered WhatsApp Agent directly.',
      },
      {
        id: 'facebook',
        label: 'Facebook Messenger',
        type: 'messenger',
        href: 'https://m.me/aloeeducation',
        icon: 'facebook',
        logoUrl: facebookLogo,
        enabled: true,
        description: 'Message us on Facebook Messenger.',
      },
    ];

    return NextResponse.json({ buttons, count: buttons.length });
  } catch (error) {
    console.error('public/contact-buttons GET error:', error);
    // Even if DB fails, return defaults so the public site never breaks
    return NextResponse.json({
      buttons: [
        {
          id: 'ai_agent',
          label: 'AI Agent',
          type: 'ai_chat',
          href: '/api/public/chat',
          icon: 'ai',
          logoUrl: null,
          enabled: true,
          description: 'Chat with our AI assistant 24/7 for instant answers.',
        },
        {
          id: 'whatsapp_ai_agent',
          label: 'WhatsApp AI Agent',
          type: 'whatsapp',
          href: 'https://wa.me/8801805020100',
          phoneNumber: '+8801805020100',
          displayNumber: '01805020100',
          icon: 'whatsapp',
          logoUrl: null,
          enabled: true,
          description: 'Chat with our AI-powered WhatsApp Agent directly.',
        },
        {
          id: 'facebook',
          label: 'Facebook Messenger',
          type: 'messenger',
          href: 'https://m.me/aloeeducation',
          icon: 'facebook',
          logoUrl: null,
          enabled: true,
          description: 'Message us on Facebook Messenger.',
        },
      ],
      count: 3,
    });
  }
}
