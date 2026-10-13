/**
 * Brand email layout — shared by all 12 templates.
 * Renders responsive HTML with:
 *   - Orange/blue brand styling
 *   - Dark mode support (via prefers-color-scheme + embedded styles)
 *   - Logo, footer, social links, legal notice
 *   - Plaintext companion
 *
 * Templates call `renderEmail()` with a content block; the layout wraps it.
 */

import { env } from "@/lib/env";
import { FACEBOOK_URL, PROFILE } from "@/lib/site-data";

export type EmailTemplateData = {
  /** Email subject line */
  subject: string;
  /** Preheader — short preview text shown in inbox before opening */
  preheader?: string;
  /** Hero/subject accent color — "orange" | "blue" */
  accent?: "orange" | "blue";
  /** Main HTML body content (inside the card) */
  bodyHtml: string;
  /** Plaintext body content */
  bodyText: string;
};

const ORANGE = "#F26113";
const BLUE = "#0B63CE";
const INK_950 = "#0A1228";
const INK_900 = "#0F1B3D";
const INK_100 = "#F1F4FA";

export function renderEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const { subject, preheader, accent = "blue", bodyHtml, bodyText } = data;
  const siteUrl = env().siteUrl;
  const accentColor = accent === "orange" ? ORANGE : BLUE;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Al Aminn</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 100% !important; margin: 0 !important; padding: 0 !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    /* Base */
    body { background-color: ${INK_100}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${INK_900}; font-size: 16px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,27,61,0.08); }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid #EEF1F7; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-mark { display: inline-flex; width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, ${ORANGE} 0%, ${BLUE} 100%); align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; letter-spacing: -0.02em; }
    .brand-name { font-size: 15px; font-weight: 700; color: ${INK_950}; letter-spacing: -0.01em; }
    .brand-sub { font-size: 11px; color: #6B7A99; letter-spacing: 0.08em; text-transform: uppercase; }
    .accent-bar { height: 4px; background: linear-gradient(90deg, ${ORANGE} 0%, ${BLUE} 100%); }
    .body { padding: 32px; }
    .body h1 { font-size: 22px; font-weight: 800; color: ${INK_950}; margin-bottom: 12px; letter-spacing: -0.02em; line-height: 1.3; }
    .body h2 { font-size: 18px; font-weight: 700; color: ${INK_950}; margin: 20px 0 8px; }
    .body p { margin: 0 0 14px; color: #2A3654; }
    .body a { color: ${accentColor}; font-weight: 600; }
    .body a:hover { text-decoration: underline; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 10px; background: ${accentColor}; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none !important; margin: 8px 0 16px; }
    .meta { background: ${INK_100}; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 14px; color: #2A3654; }
    .meta strong { color: ${INK_950}; }
    .footer { padding: 24px 32px; background: ${INK_950}; color: #B8C4DE; font-size: 12px; line-height: 1.5; }
    .footer a { color: #FFD4B8; }
    .footer-social { margin: 12px 0; }
    .footer-social a { display: inline-block; margin-right: 12px; color: #B8C4DE; }
    .footer-legal { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #6B7A99; }
    .preheader { display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; }
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body { background-color: #050912 !important; }
      .card { background: #0F1B3D !important; }
      .body { color: #D6DEEE !important; }
      .body h1, .body h2 { color: #FFFFFF !important; }
      .body p { color: #B8C4DE !important; }
      .meta { background: #1A2747 !important; color: #B8C4DE !important; }
      .header { border-bottom-color: #1A2747 !important; }
      .brand-name { color: #FFFFFF !important; }
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container { padding: 12px 8px !important; }
      .header, .body, .footer { padding: 20px !important; }
      .body h1 { font-size: 19px !important; }
      .btn { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${escapeHtml(preheader)}</div>` : ""}
  <div class="container">
    <div class="card">
      <div class="accent-bar"></div>
      <div class="header">
        <div class="brand">
          <span class="brand-mark">A</span>
          <div>
            <div class="brand-name">Al Aminn</div>
            <div class="brand-sub">Alaminn.info</div>
          </div>
        </div>
      </div>
      <div class="body">
        ${bodyHtml}
      </div>
      <div class="footer">
        <div style="font-weight:700;color:#FFFFFF;margin-bottom:6px;">Al Aminn · ${escapeHtml(PROFILE.positioning.split(",")[0])}</div>
        <div>Dhaka, Bangladesh · Working globally</div>
        <div class="footer-social">
          <a href="${escapeAttr(FACEBOOK_URL)}">Facebook</a>
          <a href="mailto:hello@alaminn.info">Email</a>
          <a href="${escapeAttr(siteUrl)}">Website</a>
        </div>
        <div class="footer-legal">
          © ${year} Al Aminn · Alaminn.info. All rights reserved.<br/>
          You received this email because of your relationship with Al Aminn.
          Student services route to ALO Education. AI publishing requires approval.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Al Aminn — Alaminn.info
${"=".repeat(40)}

${bodyText}

${"─".repeat(40)}
Al Aminn · ${PROFILE.positioning.split(",")[0]}
Dhaka, Bangladesh · Working globally
Facebook: ${FACEBOOK_URL}
Email: hello@alaminn.info
Website: ${siteUrl}

© ${year} Al Aminn · Alaminn.info. All rights reserved.
You received this email because of your relationship with Al Aminn.
Student services route to ALO Education. AI publishing requires approval.
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
