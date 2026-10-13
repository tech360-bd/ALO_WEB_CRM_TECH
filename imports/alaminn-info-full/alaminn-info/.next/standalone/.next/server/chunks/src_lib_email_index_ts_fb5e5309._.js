module.exports=[62291,9815,59951,3395,95569,e=>{"use strict";var t=e.i(47499);let n=null,r=null;function i(e){return"string"==typeof e?e:`${e.name} <${e.address}>`}function o(e){if(e)return Array.isArray(e)?e.map(i):[i(e)]}async function a(){if(n)return n;let r=(0,t.env)();return r.smtpHost&&r.smtpUser&&r.smtpPass&&r.smtpPort?n=(await e.A(9390)).createTransport({host:r.smtpHost,port:r.smtpPort,secure:465===r.smtpPort,auth:{user:r.smtpUser,pass:r.smtpPass}}):null}async function s(){if(r)return r;let e=(0,t.env)();return e.resendApiKey?r={emails:{async send(t){let n=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${e.resendApiKey}`,"Content-Type":"application/json"},body:JSON.stringify(t)});if(!n.ok){let e=await n.text().catch(()=>"");throw Error(`Resend API ${n.status}: ${e.slice(0,200)}`)}return{id:(await n.json()).id}}}}:null}async function l(e){let n=Date.now(),r=(0,t.env)(),l=e.from?i(e.from):r.emailFrom,c=e.replyTo?i(e.replyTo):r.emailReplyTo,u=o(e.to);try{let t=await s();if(t){let r=await t.emails.send({from:l,to:u,cc:o(e.cc),bcc:o(e.bcc),reply_to:c,subject:e.subject,html:e.html,text:e.text,attachments:e.attachments?.map(e=>({filename:e.filename,content:"string"==typeof e.content?e.content:e.content.toString("base64"),content_type:e.contentType}))});return{success:!0,messageId:r.id,provider:"resend",durationMs:Date.now()-n}}}catch(e){return{success:!1,provider:"resend",error:e instanceof Error?e.message:String(e),durationMs:Date.now()-n}}try{let t=await a();if(t){let r=await t.sendMail({from:l,to:u.join(", "),cc:o(e.cc)?.join(", "),bcc:o(e.bcc)?.join(", "),replyTo:c,subject:e.subject,html:e.html,text:e.text,attachments:e.attachments,messageId:e.messageId});return{success:!0,messageId:r.messageId,provider:"smtp",durationMs:Date.now()-n}}}catch(e){return{success:!1,provider:"smtp",error:e instanceof Error?e.message:String(e),durationMs:Date.now()-n}}return r.isDev?(console.log(`
┌─── 📧 DEV EMAIL (no transport configured) ───────────────────
│ To: ${u.join(", ")}
│ From: ${l}
│ Subject: ${e.subject}
│ Text:
${e.text.split("\n").map(e=>`│   ${e}`).join("\n")}
└──────────────────────────────────────────────────────────────
`),{success:!0,provider:"console",durationMs:Date.now()-n}):(console.error("[email] No transport configured in production. Email NOT sent:",{to:u,subject:e.subject}),{success:!1,provider:"none",error:"No email transport configured",durationMs:Date.now()-n})}function c(){return(0,t.env)().emailConfigured}e.s(["isEmailConfigured",()=>c,"sendEmail",()=>l],9815);let u="Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder",d="https://www.facebook.com/share/1axbZeACyf/?mibextid=wwXIfr";encodeURIComponent("Hi Al Aminn, I'd like to explore working together.");let p="#F26113",m="#0B63CE",g="#0A1228",h="#F1F4FA";function y(e){let{subject:n,preheader:r,accent:i="blue",bodyHtml:o,bodyText:a}=e,s=(0,t.env)().siteUrl,l="orange"===i?p:m,c=new Date().getFullYear();return{subject:n,html:`<!DOCTYPE html>
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
    body { background-color: ${h}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F1B3D; font-size: 16px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,27,61,0.08); }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid #EEF1F7; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-mark { display: inline-flex; width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, ${p} 0%, ${m} 100%); align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; letter-spacing: -0.02em; }
    .brand-name { font-size: 15px; font-weight: 700; color: ${g}; letter-spacing: -0.01em; }
    .brand-sub { font-size: 11px; color: #6B7A99; letter-spacing: 0.08em; text-transform: uppercase; }
    .accent-bar { height: 4px; background: linear-gradient(90deg, ${p} 0%, ${m} 100%); }
    .body { padding: 32px; }
    .body h1 { font-size: 22px; font-weight: 800; color: ${g}; margin-bottom: 12px; letter-spacing: -0.02em; line-height: 1.3; }
    .body h2 { font-size: 18px; font-weight: 700; color: ${g}; margin: 20px 0 8px; }
    .body p { margin: 0 0 14px; color: #2A3654; }
    .body a { color: ${l}; font-weight: 600; }
    .body a:hover { text-decoration: underline; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 10px; background: ${l}; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none !important; margin: 8px 0 16px; }
    .meta { background: ${h}; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 14px; color: #2A3654; }
    .meta strong { color: ${g}; }
    .footer { padding: 24px 32px; background: ${g}; color: #B8C4DE; font-size: 12px; line-height: 1.5; }
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
  ${r?`<div class="preheader">${f(r)}</div>`:""}
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
        ${o}
      </div>
      <div class="footer">
        <div style="font-weight:700;color:#FFFFFF;margin-bottom:6px;">Al Aminn \xb7 ${f(u.split(",")[0])}</div>
        <div>Dhaka, Bangladesh \xb7 Working globally</div>
        <div class="footer-social">
          <a href="${b(d)}">Facebook</a>
          <a href="mailto:hello@alaminn.info">Email</a>
          <a href="${b(s)}">Website</a>
        </div>
        <div class="footer-legal">
          \xa9 ${c} Al Aminn \xb7 Alaminn.info. All rights reserved.<br/>
          You received this email because of your relationship with Al Aminn.
          Student services route to ALO Education. AI publishing requires approval.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,text:`Al Aminn — Alaminn.info
${"=".repeat(40)}

${a}

${"─".repeat(40)}
Al Aminn \xb7 ${u.split(",")[0]}
Dhaka, Bangladesh \xb7 Working globally
Facebook: ${d}
Email: hello@alaminn.info
Website: ${s}

\xa9 ${c} Al Aminn \xb7 Alaminn.info. All rights reserved.
You received this email because of your relationship with Al Aminn.
Student services route to ALO Education. AI publishing requires approval.
`}}function f(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function b(e){return f(e).replace(/'/g,"&#39;")}function v(e,t){return`<a href="${e}" class="btn">${t}</a>`}e.s(["renderEmail",()=>y],59951);let $={inquiryConfirmation:function(e){let n=e.inquiryType.replace(/-/g," ");return y({subject:"Thank you for your inquiry — Al Aminn",preheader:`Your inquiry ${e.reference} has been received`,accent:"orange",bodyHtml:`
      <h1>Thank you, ${r(e.name)}</h1>
      <p>Your inquiry has been received and logged with reference <strong>${r(e.reference)}</strong>.</p>
      <div class="meta">
        <strong>Reference:</strong> ${r(e.reference)}<br/>
        <strong>Type:</strong> ${r(n)}<br/>
        <strong>Expected response:</strong> Within one business day
      </div>
      <p>Our team is reviewing the details and will connect you with the right specialist. If you need to add context, reply to this email and include your reference number.</p>
      ${v((0,t.env)().siteUrl+"/#contact","View your inquiry options")}
      <p style="font-size:13px;color:#6B7A99;">If you did not submit this inquiry, please ignore this email — no action is needed.</p>
    `,bodyText:`Thank you, ${e.name}

Your inquiry has been received and logged with reference ${e.reference}.

Reference: ${e.reference}
Type: ${n}
Expected response: Within one business day

Our team is reviewing the details and will connect you with the right specialist. If you need to add context, reply to this email and include your reference number.

Visit: ${(0,t.env)().siteUrl}/#contact

If you did not submit this inquiry, please ignore this email.`});function r(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},inquiryReceivedInternal:function(e){return y({subject:`New inquiry received — ${e.reference}`,preheader:`New inquiry ${e.reference} — ${e.name}`,accent:"orange",bodyHtml:`
      <h1>New inquiry received</h1>
      <div class="meta">
        <strong>Reference:</strong> ${n(e.reference)}<br/>
        <strong>Name:</strong> ${n(e.name)}<br/>
        <strong>Email:</strong> ${n(e.email)}<br/>
        <strong>Type:</strong> ${n(e.inquiryType.replace(/-/g," "))}<br/>
        ${e.organization?`<strong>Organization:</strong> ${n(e.organization)}<br/>`:""}
      </div>
      ${e.currentChallenge?`<h2>Current challenge</h2><p>${n(e.currentChallenge)}</p>`:""}
      <p>A follow-up task has been auto-created. Acknowledge within one business day via the Command Center.</p>
      ${v((0,t.env)().siteUrl+"/#staff","Open Command Center")}
    `,bodyText:`New inquiry received

Reference: ${e.reference}
Name: ${e.name}
Email: ${e.email}
Type: ${e.inquiryType.replace(/-/g," ")}
${e.organization?"Organization: "+e.organization:""}

${e.currentChallenge?"Current challenge:\n"+e.currentChallenge+"\n\n":""}A follow-up task has been auto-created. Acknowledge within one business day via the Command Center.

Open: ${(0,t.env)().siteUrl}/#staff`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},meetingConfirmation:function(e){return y({subject:"Your meeting is confirmed — Al Aminn",preheader:`Your meeting is confirmed — ${e.scheduledAt}`,accent:"blue",bodyHtml:`
      <h1>Your meeting is confirmed</h1>
      <p>Hi ${t(e.name)}, your ${t(e.meetingType)} meeting with Al Aminn is confirmed.</p>
      <div class="meta">
        <strong>When:</strong> ${t(e.scheduledAt)} (${t(e.timezone)})<br/>
        <strong>Duration:</strong> ${e.durationMin} minutes<br/>
        <strong>Type:</strong> ${t(e.meetingType)}<br/>
        ${e.location?`<strong>Location:</strong> ${t(e.location)}<br/>`:""}
      </div>
      ${e.joinUrl?v(e.joinUrl,"Join the meeting"):""}
      <p>Please arrive 2 minutes early. If you need to reschedule, reply to this email at least 4 hours before the start time.</p>
    `,bodyText:`Your meeting is confirmed

Hi ${e.name}, your ${e.meetingType} meeting with Al Aminn is confirmed.

When: ${e.scheduledAt} (${e.timezone})
Duration: ${e.durationMin} minutes
Type: ${e.meetingType}
${e.location?"Location: "+e.location:""}

${e.joinUrl?"Join: "+e.joinUrl+"\n\n":""}Please arrive 2 minutes early. If you need to reschedule, reply to this email at least 4 hours before the start time.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},meetingReminder:function(e){return y({subject:"Reminder: your meeting with Al Aminn starts soon",preheader:"Reminder: your meeting starts soon",accent:"blue",bodyHtml:`
      <h1>Meeting reminder</h1>
      <p>Hi ${t(e.name)}, this is a reminder for your upcoming meeting with Al Aminn.</p>
      <div class="meta">
        <strong>Starts:</strong> ${t(e.scheduledAt)}<br/>
        <strong>Duration:</strong> ${e.durationMin} minutes
      </div>
      ${e.joinUrl?v(e.joinUrl,"Join now"):""}
      <p>Looking forward to our conversation.</p>
    `,bodyText:`Meeting reminder

Hi ${e.name}, this is a reminder for your upcoming meeting with Al Aminn.

Starts: ${e.scheduledAt}
Duration: ${e.durationMin} minutes

${e.joinUrl?"Join now: "+e.joinUrl+"\n\n":""}Looking forward to our conversation.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},newsletterVerification:function(e){return y({subject:"Please verify your email — Alaminn.info",preheader:"Please verify your email to start receiving insights",accent:"blue",bodyHtml:`
      <h1>Verify your email</h1>
      <p>Welcome! Please confirm your email address to start receiving executive insights and operational strategy updates from Al Aminn.</p>
      ${v(e.verifyUrl,"Verify email address")}
      <p style="font-size:13px;color:#6B7A99;">This link expires in 24 hours. If you did not subscribe, you can safely ignore this email — your address will not be added to any list.</p>
    `,bodyText:`Verify your email

Welcome! Please confirm your email address to start receiving executive insights and operational strategy updates from Al Aminn.

Verify: ${e.verifyUrl}

This link expires in 24 hours. If you did not subscribe, you can safely ignore this email — your address will not be added to any list.`})},newsletterWelcome:function(e){return y({subject:"Welcome to the Alaminn.info brief",preheader:"You're in. Here's what to expect.",accent:"orange",bodyHtml:`
      <h1>Welcome aboard${e.name?`, ${e.name.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}`:""}</h1>
      <p>Your email is verified. You'll now receive the bi-weekly brief: executive insights on operations, growth, education strategy and AI governance — no fluff, no spam.</p>
      <h2>What to expect</h2>
      <p>• Bi-weekly briefs (every other Tuesday)<br/>
      • Occasional deep-dives on AI governance and operating systems<br/>
      • Early access to resources and templates</p>
      ${v((0,t.env)().siteUrl+"/#insights","Read recent insights")}
      <p>You can unsubscribe anytime using the link in any email.</p>
    `,bodyText:`Welcome aboard${e.name?", "+e.name:""}

Your email is verified. You'll now receive the bi-weekly brief: executive insights on operations, growth, education strategy and AI governance — no fluff, no spam.

What to expect:
• Bi-weekly briefs (every other Tuesday)
• Occasional deep-dives on AI governance and operating systems
• Early access to resources and templates

Read recent insights: ${(0,t.env)().siteUrl}/#insights

You can unsubscribe anytime using the link in any email.`})},newsletterUnsubscribe:function(e){return y({subject:"You have been unsubscribed — Alaminn.info",preheader:"You've been unsubscribed",accent:"blue",bodyHtml:`
      <h1>You're unsubscribed</h1>
      <p>Your email <strong>${n(e.email)}</strong> has been removed from the Alaminn.info newsletter. You will not receive further updates.</p>
      ${e.reason?`<p><em>Reason noted: ${n(e.reason)}</em></p>`:""}
      <p>If this was a mistake, you can resubscribe anytime from the website footer.</p>
      ${v((0,t.env)().siteUrl+"/#newsletter","Resubscribe")}
    `,bodyText:`You're unsubscribed

Your email ${e.email} has been removed from the Alaminn.info newsletter. You will not receive further updates.

${e.reason?"Reason noted: "+e.reason+"\n\n":""}If this was a mistake, you can resubscribe anytime from the website footer.

Resubscribe: ${(0,t.env)().siteUrl}/#newsletter`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},aiTaskCompleted:function(e){return y({subject:"Your AI task output is ready for review",preheader:"Your AI task output is ready for review",accent:"orange",bodyHtml:`
      <h1>AI task completed</h1>
      <p>Your AI task for <strong>${t(e.workflow)}</strong> has finished processing. The output is ready for your review.</p>
      <div class="meta">
        <strong>Workflow:</strong> ${t(e.workflow)}<br/>
        <strong>Objective:</strong> ${t(e.objective)}
      </div>
      <p>The output will not be published until you approve it. This is part of the governed AI workflow — all external outputs require human approval.</p>
      ${v(e.reviewUrl,"Review output")}
    `,bodyText:`AI task completed

Your AI task for ${e.workflow} has finished processing. The output is ready for your review.

Workflow: ${e.workflow}
Objective: ${e.objective}

The output will not be published until you approve it. This is part of the governed AI workflow — all external outputs require human approval.

Review output: ${e.reviewUrl}`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},aiTaskRequiresReview:function(e){return y({subject:"AI task requires your review — Alaminn.info",preheader:`AI task awaiting approval — ${e.sensitivity} sensitivity`,accent:"orange",bodyHtml:`
      <h1>AI task requires your review</h1>
      <p>An AI task with <strong>${t(e.sensitivity)}</strong> sensitivity is awaiting approval before it can be published or acted upon.</p>
      <div class="meta">
        <strong>Workflow:</strong> ${t(e.workflow)}<br/>
        <strong>Sensitivity:</strong> ${t(e.sensitivity)}<br/>
        <strong>Submitted by:</strong> ${t(e.submittedBy)}
      </div>
      <p>Per governance policy, this task cannot proceed without explicit human approval. Please review at your earliest convenience.</p>
      ${v(e.reviewUrl,"Open approval queue")}
    `,bodyText:`AI task requires your review

An AI task with ${e.sensitivity} sensitivity is awaiting approval before it can be published or acted upon.

Workflow: ${e.workflow}
Sensitivity: ${e.sensitivity}
Submitted by: ${e.submittedBy}

Per governance policy, this task cannot proceed without explicit human approval. Please review at your earliest convenience.

Open approval queue: ${e.reviewUrl}`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},passwordReset:function(e){return y({subject:"Reset your password — Alaminn.info",preheader:"Password reset request for your Alaminn.info account",accent:"blue",bodyHtml:`
      <h1>Reset your password</h1>
      <p>Hi ${t(e.name)}, a password reset was requested for your Alaminn.info staff account.</p>
      ${v(e.resetUrl,"Reset password")}
      <p style="font-size:13px;color:#6B7A99;">This link expires in ${t(e.expiresIn)}. If you did not request a reset, you can safely ignore this email — your password will not be changed.</p>
      <p style="font-size:13px;color:#6B7A99;">For security, this link can only be used once.</p>
    `,bodyText:`Reset your password

Hi ${e.name}, a password reset was requested for your Alaminn.info staff account.

Reset password: ${e.resetUrl}

This link expires in ${e.expiresIn}. If you did not request a reset, you can safely ignore this email — your password will not be changed.

For security, this link can only be used once.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},staffInvitation:function(e){return y({subject:"You are invited to join Alaminn.info",preheader:"You're invited to join the Alaminn.info team",accent:"orange",bodyHtml:`
      <h1>You're invited</h1>
      <p>Hi ${t(e.name)}, you've been invited to join the Alaminn.info Command Center as a <strong>${t(e.role)}</strong>.</p>
      <div class="meta">
        <strong>Role:</strong> ${t(e.role)}<br/>
        <strong>Invited by:</strong> ${t(e.invitedBy)}<br/>
        <strong>Email:</strong> ${t(e.email)}
      </div>
      <p>Click below to set your password and activate your account. This invitation expires in 7 days.</p>
      ${v(e.acceptUrl,"Accept invitation")}
      <p style="font-size:13px;color:#6B7A99;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    `,bodyText:`You're invited

Hi ${e.name}, you've been invited to join the Alaminn.info Command Center as a ${e.role}.

Role: ${e.role}
Invited by: ${e.invitedBy}
Email: ${e.email}

Click below to set your password and activate your account. This invitation expires in 7 days.

Accept invitation: ${e.acceptUrl}

If you weren't expecting this invitation, you can safely ignore this email.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},securityAlert:function(e){return y({subject:"Security alert — Alaminn.info",preheader:`Security alert — ${e.alertType}`,accent:"orange",bodyHtml:`
      <h1>Security alert</h1>
      <p>Hi ${n(e.recipientName)}, we detected activity on your Alaminn.info account that we want to flag.</p>
      <div class="meta">
        <strong>Alert type:</strong> ${n(e.alertType)}<br/>
        <strong>Time:</strong> ${n(e.timestamp)}<br/>
        ${e.ipHash?`<strong>Source (hashed):</strong> ${n(e.ipHash)}<br/>`:""}
      </div>
      <h2>What happened</h2>
      <p>${n(e.description)}</p>
      ${e.actionRequired?`<h2>Action required</h2><p>${n(e.actionRequired)}</p>`:""}
      <p>If this was you, no action is needed. If you don't recognize this activity, please sign in and change your password immediately.</p>
      ${v((0,t.env)().siteUrl+"/#staff","Sign in to Command Center")}
    `,bodyText:`Security alert

Hi ${e.recipientName}, we detected activity on your Alaminn.info account that we want to flag.

Alert type: ${e.alertType}
Time: ${e.timestamp}
${e.ipHash?"Source (hashed): "+e.ipHash:""}

What happened:
${e.description}

${e.actionRequired?"Action required:\n"+e.actionRequired+"\n\n":""}If this was you, no action is needed. If you don't recognize this activity, please sign in and change your password immediately.

Sign in: ${(0,t.env)().siteUrl}/#staff`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},studentRegistration:function(e){return y({subject:"Welcome to Alaminn.info Higher Study — your account is ready",preheader:`Your student account ${e.studentId} is active`,accent:"orange",bodyHtml:`
      <h1>Welcome, ${t(e.name)}</h1>
      <p>Your Higher Study student account has been created successfully. You can now track applications, save universities and courses, and receive personalised deadline alerts.</p>
      <div class="meta">
        <strong>Student ID:</strong> ${t(e.studentId)}<br/>
        <strong>Email:</strong> ${t(e.email)}<br/>
        <strong>Platform:</strong> Alaminn.info Higher Study
      </div>
      ${v(e.loginUrl,"Sign in to your account")}
      <p style="font-size:13px;color:#6B7A99;">Keep your Student ID safe — you'll need it for all future applications and correspondence.</p>
    `,bodyText:`Welcome, ${e.name}

Your Higher Study student account has been created successfully. You can now track applications, save universities and courses, and receive personalised deadline alerts.

Student ID: ${e.studentId}
Email: ${e.email}
Platform: Alaminn.info Higher Study

Sign in: ${e.loginUrl}

Keep your Student ID safe — you'll need it for all future applications and correspondence.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},otpVerification:function(e){return y({subject:`Your verification code: ${e.code}`,preheader:`OTP for ${e.purpose} — expires in ${e.expiresIn}`,accent:"blue",bodyHtml:`
      <h1>Your verification code</h1>
      <p>Hi ${t(e.name)}, use the code below to complete your <strong>${t(e.purpose)}</strong>. This code is single-use and expires in ${t(e.expiresIn)}.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;font-family:'DM Serif Display',Georgia,serif;font-size:42px;letter-spacing:12px;padding:20px 32px;background:#F1F4FA;border:2px dashed #0B63CE;border-radius:12px;color:#0F1B3D;font-weight:700;">${t(e.code)}</div>
      </div>
      <p style="font-size:13px;color:#6B7A99;">If you did not request this code, please ignore this email — no action will be taken on your account. Never share this code with anyone, including staff claiming to be from Alaminn.info.</p>
    `,bodyText:`Your verification code

Hi ${e.name}, use the code below to complete your ${e.purpose}. This code is single-use and expires in ${e.expiresIn}.

  ${e.code}

If you did not request this code, please ignore this email — no action will be taken on your account. Never share this code with anyone, including staff claiming to be from Alaminn.info.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},accountActivation:function(e){return y({subject:"Activate your Alaminn.info account",preheader:`Activate your account — link expires in ${e.expiresIn}`,accent:"orange",bodyHtml:`
      <h1>Activate your account</h1>
      <p>Hi ${t(e.name)}, your account has been created. Click the button below to activate it and set your password.</p>
      <div class="meta">
        <strong>Email:</strong> ${t(e.email)}<br/>
        <strong>Expires in:</strong> ${t(e.expiresIn)}
      </div>
      ${v(e.activateUrl,"Activate account")}
      <p style="font-size:13px;color:#6B7A99;">This activation link can only be used once. If it expires, you can request a new one from the sign-in page.</p>
    `,bodyText:`Activate your account

Hi ${e.name}, your account has been created. Click the link below to activate it and set your password.

Email: ${e.email}
Expires in: ${e.expiresIn}

Activate: ${e.activateUrl}

This activation link can only be used once. If it expires, you can request a new one from the sign-in page.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},consultationRequested:function(e){return y({subject:`Consultation request received — ${e.reference}`,preheader:`We've received your consultation request for ${e.topic}`,accent:"orange",bodyHtml:`
      <h1>Consultation request received</h1>
      <p>Hi ${n(e.name)}, we've received your request for a 1:1 consultation. Our team will confirm your slot within one business day.</p>
      <div class="meta">
        <strong>Reference:</strong> ${n(e.reference)}<br/>
        <strong>Topic:</strong> ${n(e.topic)}<br/>
        <strong>Preferred date:</strong> ${n(e.preferredDate)}<br/>
        <strong>Preferred time:</strong> ${n(e.preferredTime)} (${n(e.timezone)})
      </div>
      <p>If you need to reschedule or cancel, reply to this email with your reference number. A calendar invitation will be sent once the slot is confirmed.</p>
      ${v((0,t.env)().siteUrl+"/higher-study/book-consultation","View consultation options")}
    `,bodyText:`Consultation request received

Hi ${e.name}, we've received your request for a 1:1 consultation. Our team will confirm your slot within one business day.

Reference: ${e.reference}
Topic: ${e.topic}
Preferred date: ${e.preferredDate}
Preferred time: ${e.preferredTime} (${e.timezone})

If you need to reschedule or cancel, reply to this email with your reference number. A calendar invitation will be sent once the slot is confirmed.

View: ${(0,t.env)().siteUrl}/higher-study/book-consultation`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},consultationConfirmed:function(e){return y({subject:`Consultation confirmed — ${e.scheduledAt}`,preheader:`Your consultation with ${e.counsellorName} is confirmed`,accent:"blue",bodyHtml:`
      <h1>Your consultation is confirmed</h1>
      <p>Hi ${t(e.name)}, your 1:1 consultation with <strong>${t(e.counsellorName)}</strong> has been booked.</p>
      <div class="meta">
        <strong>Reference:</strong> ${t(e.reference)}<br/>
        <strong>When:</strong> ${t(e.scheduledAt)} (${t(e.timezone)})<br/>
        <strong>Duration:</strong> ${e.durationMin} minutes<br/>
        <strong>Counsellor:</strong> ${t(e.counsellorName)}
      </div>
      ${e.joinUrl?v(e.joinUrl,"Join the consultation"):""}
      <p>Please join 2 minutes early. Have your goals and any documents ready. If you need to reschedule, reply at least 4 hours before the start time.</p>
    `,bodyText:`Your consultation is confirmed

Hi ${e.name}, your 1:1 consultation with ${e.counsellorName} has been booked.

Reference: ${e.reference}
When: ${e.scheduledAt} (${e.timezone})
Duration: ${e.durationMin} minutes
Counsellor: ${e.counsellorName}

${e.joinUrl?"Join: "+e.joinUrl+"\n\n":""}Please join 2 minutes early. Have your goals and any documents ready. If you need to reschedule, reply at least 4 hours before the start time.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},consultationScheduled:function(e){return y({subject:"Reminder: your consultation starts soon",preheader:`Your consultation with ${e.counsellorName} starts soon`,accent:"blue",bodyHtml:`
      <h1>Consultation reminder</h1>
      <p>Hi ${t(e.name)}, this is a reminder for your upcoming consultation.</p>
      <div class="meta">
        <strong>Reference:</strong> ${t(e.reference)}<br/>
        <strong>Starts:</strong> ${t(e.scheduledAt)}<br/>
        <strong>Duration:</strong> ${e.durationMin} minutes<br/>
        <strong>Counsellor:</strong> ${t(e.counsellorName)}
      </div>
      ${e.joinUrl?v(e.joinUrl,"Join now"):""}
      <p>Have your questions ready. We look forward to a productive session.</p>
    `,bodyText:`Consultation reminder

Hi ${e.name}, this is a reminder for your upcoming consultation.

Reference: ${e.reference}
Starts: ${e.scheduledAt}
Duration: ${e.durationMin} minutes
Counsellor: ${e.counsellorName}

${e.joinUrl?"Join now: "+e.joinUrl+"\n\n":""}Have your questions ready. We look forward to a productive session.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},applicationStatusUpdate:function(e){let t="rejected"===e.status||"withdrawn"===e.status?"orange":"blue";return y({subject:`Application update — ${e.programme} at ${e.university}`,preheader:`Status: ${e.status} — ${e.applicationId}`,accent:t,bodyHtml:`
      <h1>Application status update</h1>
      <p>Hi ${n(e.name)}, there's an update on your application.</p>
      <div class="meta">
        <strong>Application ID:</strong> ${n(e.applicationId)}<br/>
        <strong>Programme:</strong> ${n(e.programme)}<br/>
        <strong>University:</strong> ${n(e.university)}<br/>
        <strong>Status:</strong> <span style="text-transform:uppercase;font-weight:700;">${n(e.status)}</span>
      </div>
      <h2>What this means</h2>
      <p>${n(e.statusMessage)}</p>
      ${v(e.portalUrl,"View application details")}
      <p style="font-size:13px;color:#6B7A99;">If you have questions about this update, reply to this email with your Application ID. Our team typically responds within one business day.</p>
    `,bodyText:`Application status update

Hi ${e.name}, there's an update on your application.

Application ID: ${e.applicationId}
Programme: ${e.programme}
University: ${e.university}
Status: ${e.status.toUpperCase()}

What this means:
${e.statusMessage}

View application details: ${e.portalUrl}

If you have questions about this update, reply to this email with your Application ID. Our team typically responds within one business day.`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},scholarshipDeadlineAlert:function(e){let t=e.daysRemaining<=3?"URGENT":e.daysRemaining<=7?"Soon":"Reminder";return y({subject:`[${t}] Scholarship deadline — ${e.scholarshipName}`,preheader:`${e.daysRemaining} days remaining to apply for ${e.scholarshipName}`,accent:"orange",bodyHtml:`
      <h1>Scholarship deadline ${t.toLowerCase()}</h1>
      <p>Hi ${n(e.name)}, this is a reminder that the deadline for the scholarship you saved is approaching.</p>
      <div class="meta">
        <strong>Scholarship:</strong> ${n(e.scholarshipName)}<br/>
        <strong>Provider:</strong> ${n(e.provider)}<br/>
        <strong>Deadline:</strong> ${n(e.deadlineDate)}<br/>
        <strong>Days remaining:</strong> <span style="font-weight:700;color:#F26113;">${e.daysRemaining}</span>
      </div>
      ${v(e.applyUrl,"Apply now")}
      <p style="font-size:13px;color:#6B7A99;">Late applications are typically not accepted. Start your application today and reach out if you need guidance on documents or eligibility.</p>
    `,bodyText:`Scholarship deadline ${t.toLowerCase()}

Hi ${e.name}, this is a reminder that the deadline for the scholarship you saved is approaching.

Scholarship: ${e.scholarshipName}
Provider: ${e.provider}
Deadline: ${e.deadlineDate}
Days remaining: ${e.daysRemaining}

Apply now: ${e.applyUrl}

Late applications are typically not accepted. Start your application today and reach out if you need guidance on documents or eligibility.`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},phdDeadlineAlert:function(e){let t=e.daysRemaining<=3?"URGENT":e.daysRemaining<=7?"Soon":"Reminder";return y({subject:`[${t}] PhD application deadline — ${e.university}`,preheader:`${e.daysRemaining} days remaining — ${e.projectTitle}`,accent:"orange",bodyHtml:`
      <h1>PhD application deadline ${t.toLowerCase()}</h1>
      <p>Hi ${n(e.name)}, this is a reminder that the application deadline for a PhD project you saved is approaching.</p>
      <div class="meta">
        <strong>Project:</strong> ${n(e.projectTitle)}<br/>
        <strong>Supervisor:</strong> ${n(e.supervisorName)}<br/>
        <strong>University:</strong> ${n(e.university)}<br/>
        <strong>Deadline:</strong> ${n(e.deadlineDate)}<br/>
        <strong>Days remaining:</strong> <span style="font-weight:700;color:#F26113;">${e.daysRemaining}</span>
      </div>
      ${v(e.applyUrl,"View project & apply")}
      <p style="font-size:13px;color:#6B7A99;">PhD applications typically require a research proposal, CV, and academic transcripts. Start early to give your referee time to write a strong letter.</p>
    `,bodyText:`PhD application deadline ${t.toLowerCase()}

Hi ${e.name}, this is a reminder that the application deadline for a PhD project you saved is approaching.

Project: ${e.projectTitle}
Supervisor: ${e.supervisorName}
University: ${e.university}
Deadline: ${e.deadlineDate}
Days remaining: ${e.daysRemaining}

View project & apply: ${e.applyUrl}

PhD applications typically require a research proposal, CV, and academic transcripts. Start early to give your referee time to write a strong letter.`});function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}},newsletterConfirmation:function(e){return y({subject:"Please confirm your newsletter subscription",preheader:"Confirm your subscription to receive the Alaminn.info brief",accent:"blue",bodyHtml:`
      <h1>Confirm your subscription</h1>
      <p>You're one step away from receiving the Alaminn.info brief — executive insights on operations, growth, education strategy and AI governance.</p>
      <div class="meta">
        <strong>Email:</strong> ${t(e.email)}<br/>
        <strong>Subscribed:</strong> ${t(e.subscribedAt)}<br/>
        ${e.ipAddress?`<strong>From IP:</strong> ${t(e.ipAddress)}<br/>`:""}
        <strong>Frequency:</strong> Bi-weekly (every other Tuesday)
      </div>
      ${v(e.confirmUrl,"Confirm subscription")}
      <p style="font-size:13px;color:#6B7A99;">We use double opt-in to protect your inbox. If you did not subscribe, you can safely ignore this email — your address will not be added to any list. This confirmation link expires in 24 hours.</p>
    `,bodyText:`Confirm your subscription

You're one step away from receiving the Alaminn.info brief — executive insights on operations, growth, education strategy and AI governance.

Email: ${e.email}
Subscribed: ${e.subscribedAt}
${e.ipAddress?"From IP: "+e.ipAddress+"\n":""}Frequency: Bi-weekly (every other Tuesday)

Confirm subscription: ${e.confirmUrl}

We use double opt-in to protect your inbox. If you did not subscribe, you can safely ignore this email — your address will not be added to any list. This confirmation link expires in 24 hours.`});function t(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}}};e.s(["EMAIL_TEMPLATES",0,$],3395);var w=e.i(43793);let x=[1e3,4e3,16e3];async function A(e,n,r){let i;try{i=(0,$[e])(n)}catch(n){let t={success:!1,provider:"none",error:`Template render failed: ${n instanceof Error?n.message:String(n)}`,durationMs:0};return r.skipLog||await I(e,r,t,0),t}let o={to:r.to,cc:r.cc,bcc:r.bcc,subject:i.subject,html:i.html,text:i.text},a=await l(o);return r.skipLog||await I(e,r,a,1),!a.success&&(0,t.env)().emailConfigured&&k(e,o,r,a),a}async function k(e,t,n,r){let i=r;for(let r=1;r<=3;r++){await function(e){return new Promise(t=>setTimeout(t,e))}(x[r-1]??16e3);let o=await l(t);if(n.skipLog||await I(e,n,o,r+1),i=o,o.success)break}i.success||console.error(`[email] All 4 attempts failed for ${e}`,{error:i.error})}async function I(e,t,n,r){try{await w.db.auditLog.create({data:{action:`email.${n.success?"sent":"failed"}`,resource:"email",resourceId:n.messageId||e,meta:JSON.stringify({template:e,provider:n.provider,attempt:r,durationMs:n.durationMs,error:n.error||null,triggeredBy:t.triggeredBy||null}),ipHash:t.ipHash||null}})}catch{}}e.s(["sendTransactional",()=>A],95569),e.s([],62291)}];

//# sourceMappingURL=src_lib_email_index_ts_fb5e5309._.js.map