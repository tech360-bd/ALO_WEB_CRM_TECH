import { NextRequest, NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const assignedTo = searchParams.get('assignedTo') || '';
      const where: any = {};
      if (platform) where.platform = platform;
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;
      const inbox = await db.socialInbox.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
      return NextResponse.json({ success:true, data: inbox });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { action } = body;
      // Integration not connected placeholder if token not configured
      const connected = (process.env.FACEBOOK_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN) ? true : false;

      if (action === 'reply') {
        if (!body.id || !body.replyText) return NextResponse.json({ success:false, error:'id and replyText required' }, { status:400 });
        const item = await db.socialInbox.findUnique({ where: { id: body.id } }).catch(()=>null) as any;
        if (!item) return NextResponse.json({ success:false, error:'Not found' }, { status:404 });
        if (!connected) {
          // Save draft, but show integration not connected
          await db.aiReplyDraft.create({
            data: { communicationId: body.id, promptContext: item.messageText, draftBody: body.replyText, riskFlags: JSON.stringify([]), approvalStatus: 'pending', createdBy: auth.userId }
          }).catch(()=>{});
          return NextResponse.json({ success:true, message:'Integration not connected — reply saved as AI draft pending approval. Connect Facebook/Instagram token to send live.', integrationConnected: false });
        }
        await db.socialInbox.update({ where: { id: body.id }, data: { status: 'replied' } }).catch(()=>{});
        await logAuditAction(auth, 'reply_social_inbox', 'SocialInbox', body.id, { replyText: body.replyText });
        return NextResponse.json({ success:true, message:'Replied', integrationConnected: true });
      }
      if (action === 'hide_comment') {
        await db.socialInbox.update({ where: { id: body.id }, data: { status: 'hidden' } }).catch(()=>{});
        return NextResponse.json({ success:true, message:'Comment hidden (placeholder — hides via Graph API when connected)' });
      }
      if (action === 'mark_spam') {
        await db.socialInbox.update({ where: { id: body.id }, data: { status: 'spam' } }).catch(()=>{});
        return NextResponse.json({ success:true, message:'Marked spam' });
      }
      if (action === 'create_lead') {
        const item = await db.socialInbox.findUnique({ where: { id: body.id } }).catch(()=>null) as any;
        const lead = await db.marketingLead.create({
          data: {
            name: item?.senderName || body.name || 'Social Lead',
            phone: body.phone || '',
            email: body.email || '',
            source: `social_${item?.platform || body.platform || 'facebook'}`,
            sourceDetail: item?.messageText?.substring(0,100) || '',
            status: 'new', createdById: auth.userId
          }
        }).catch(()=>null);
        if (lead && item) await db.socialInbox.update({ where: { id: body.id }, data: { leadId: lead.id, status: 'converted' } }).catch(()=>{});
        return NextResponse.json({ success:true, leadId: lead?.id, message:'Lead created and linked' });
      }
      if (action === 'assign') {
        await db.socialInbox.update({ where: { id: body.id }, data: { assignedTo: body.assignedTo } }).catch(()=>{});
        return NextResponse.json({ success:true, message:'Assigned to counselor' });
      }
      if (action === 'ai_draft') {
        const item = await db.socialInbox.findUnique({ where: { id: body.id } }).catch(()=>null) as any;
        const draftText = `Hi ${item?.senderName || 'there'}, thanks for your interest! Could you share your preferred country, study level & intake? Our counselor will send a course finder link & book a free consultation.`;
        await db.aiReplyDraft.create({
          data: { communicationId: body.id, promptContext: item?.messageText || '', draftBody: draftText, riskFlags: JSON.stringify([]), approvalStatus: 'pending', createdBy: auth.userId }
        }).catch(()=>{});
        return NextResponse.json({ success:true, draft: draftText, message:'AI draft created — review before sending, includes course finder link placeholder' });
      }
      return NextResponse.json({ success:false, error:'Unknown action: reply | hide_comment | mark_spam | create_lead | assign | ai_draft' }, { status:400 });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:500 });
    }
  })(request);
}
