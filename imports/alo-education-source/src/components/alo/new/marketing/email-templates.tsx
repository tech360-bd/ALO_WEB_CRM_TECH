'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Monitor, Smartphone, Mail, Clock, ArrowRight, CheckCircle, Sparkles
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const CORAL = '#bf4520';
const INK = '#2d3142';
const PAPER = '#f5f5f5';

// ── Email Template Types ───────────────────────────────────────────────────
interface EmailTemplateData {
  subject: string;
  preheader: string;
  greeting: string;
  body: string[];
  cta: string;
  ctaUrl: string;
  closing: string;
  fromName: string;
}

// ── Welcome Email ──────────────────────────────────────────────────────────
export function WelcomeEmail() {
  return <EmailPreview template={{
    subject: 'Welcome to ALO Education! 🎓',
    preheader: 'Your journey to studying abroad starts here',
    greeting: 'Hi {{first_name}},',
    body: [
      'Welcome to ALO Education! We\'re thrilled you\'ve taken the first step toward your international education journey.',
      'Here\'s what happens next:',
      '✅ Your profile has been created',
      '✅ A dedicated counselor will be assigned within 24 hours',
      '✅ You\'ll receive a personalized university shortlist within 3 business days',
      'In the meantime, explore our free resources to prepare for your journey.',
    ],
    cta: 'Explore Free Resources',
    ctaUrl: '#resources',
    closing: 'Looking forward to helping you achieve your dreams!',
    fromName: 'The ALO Education Team',
  }} />;
}

// ── Follow-Up Email ────────────────────────────────────────────────────────
export function FollowUpEmail() {
  return <EmailPreview template={{
    subject: 'How\'s your university search going? 🎯',
    preheader: 'Still considering your options? We\'re here to help',
    greeting: 'Hi {{first_name}},',
    body: [
      'It\'s been a few days since we last connected, and we want to make sure you have everything you need.',
      'Many students find that scheduling a one-on-one consultation helps clarify their options and speeds up the decision process.',
      'During your consultation, we\'ll:',
      '• Review your academic profile and preferences',
      '• Identify the best-fit universities for your goals',
      '• Discuss scholarship opportunities',
      '• Create a personalized application timeline',
    ],
    cta: 'Book Free Consultation',
    ctaUrl: '#consultation',
    closing: 'Don\'t hesitate to reach out — we\'re here for you every step of the way.',
    fromName: 'Your ALO Counselor',
  }} />;
}

// ── Offer Email ────────────────────────────────────────────────────────────
export function OfferEmail() {
  return <EmailPreview template={{
    subject: 'Congratulations! You\'ve Received an Offer! 🎉',
    preheader: 'Your hard work has paid off — see your university offer details',
    greeting: 'Dear {{first_name}},',
    body: [
      'Fantastic news! You\'ve received an offer from {{university_name}} for {{course_name}}.',
      'Here are your next steps:',
      '1️⃣  Review your offer letter carefully (attached)',
      '2️⃣  Accept or decline by {{deadline}}',
      '3️⃣  Pay your deposit to secure your place',
      '4️⃣  Begin your visa application with our support',
      'Our team is ready to guide you through each step. This is an exciting milestone!',
    ],
    cta: 'Accept Your Offer',
    ctaUrl: '#accept-offer',
    closing: 'Celebrating with you!',
    fromName: 'The ALO Admissions Team',
  }} />;
}

// ── Visa Update Email ──────────────────────────────────────────────────────
export function VisaUpdateEmail() {
  return <EmailPreview template={{
    subject: 'Visa Application Update: {{status}} 📋',
    preheader: 'Important update on your visa application progress',
    greeting: 'Hi {{first_name}},',
    body: [
      'We have an update on your visa application for {{country}}.',
      'Current Status: {{status}}',
      'What this means:',
      '• Your documents have been submitted and are under review',
      '• The typical processing time is 3-4 weeks',
      '• We\'ll notify you immediately when there\'s any change',
      'If you have any questions or need to submit additional documents, please don\'t hesitate to contact us.',
    ],
    cta: 'Check Visa Status',
    ctaUrl: '#visa-status',
    closing: 'We\'re monitoring your application closely.',
    fromName: 'The ALO Visa Team',
  }} />;
}

// ── Email Preview Component ────────────────────────────────────────────────
interface EmailPreviewProps {
  template: EmailTemplateData;
}

function EmailPreview({ template }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-[#f5f5f5] text-[#6b7280]" style={{ borderRadius: '4px' }}>
            Subject: {template.subject}
          </Badge>
        </div>
        <div className="flex items-center gap-1 bg-[#f5f5f5] p-0.5 rounded-[4px]">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-[3px] transition-colors ${
              viewMode === 'desktop' ? 'bg-white text-[#2d3142]' : 'text-[#9ca3af]'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-[3px] transition-colors ${
              viewMode === 'mobile' ? 'bg-white text-[#2d3142]' : 'text-[#9ca3af]'
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Preview */}
      <div
        className="bg-white border border-[#e5e7eb] mx-auto overflow-hidden"
        style={{
          borderRadius: '8px',
          maxWidth: viewMode === 'desktop' ? '600px' : '320px',
        }}
      >
        {/* Email Header */}
        <div className="bg-[#2d3142] p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#bf4520] rounded-[4px] flex items-center justify-center text-white text-xs font-bold">
              ALO
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{template.fromName}</div>
              <div className="text-white/50 text-xs">hello@aloeducation.com</div>
            </div>
          </div>
        </div>

        {/* Preheader */}
        <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#e5e7eb] text-xs text-[#9ca3af]">
          {template.preheader}
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-[#2d3142] mb-4">{template.greeting}</p>
          {template.body.map((line, i) => (
            <p
              key={i}
              className={`text-sm text-[#6b7280] leading-relaxed ${
                line.startsWith('•') || line.startsWith('✅') || line.startsWith('1️⃣') || line.match(/^\d/)
                  ? 'pl-4 my-1'
                  : 'my-3'
              }`}
            >
              {line}
            </p>
          ))}

          {/* CTA Button */}
          <div className="text-center my-6">
            <div
              className="inline-flex items-center gap-1 bg-[#bf4520] text-white font-semibold text-sm px-6 py-3"
              style={{ borderRadius: '6px' }}
            >
              {template.cta}
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <Separator className="bg-[#e5e7eb] my-4" />

          <p className="text-sm text-[#2d3142]">{template.closing}</p>
          <p className="text-sm text-[#6b7280] mt-2">
            Best regards,<br />
            <strong className="text-[#2d3142]">{template.fromName}</strong>
          </p>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#e5e7eb] text-center">
            <p className="text-[10px] text-[#9ca3af]">
              ALO Education · International Student Advisory<br />
              <span className="underline">Unsubscribe</span> · <span className="underline">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
