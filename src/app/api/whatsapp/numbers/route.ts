import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { seedOfficialNumberPool, OFFICIAL_NUMBERS, MAIN_NUMBER, COO_NUMBER } from '@/lib/whatsapp-number-pool';

export const GET = withAuth(async (req, auth) => {
  try {
    // Auto-seed if empty
    await seedOfficialNumberPool();

    const numbers = await db.whatsAppOfficialNumber.findMany({
      orderBy: { phoneNumber: 'asc' },
    });

    const stats = {
      total: numbers.length,
      expected: 20,
      connected: numbers.filter(n => n.connectionStatus === 'connected').length,
      disconnected: numbers.filter(n => n.connectionStatus === 'disconnected').length,
      main: numbers.find(n => n.phoneNumber === MAIN_NUMBER),
      coo: numbers.find(n => n.phoneNumber === COO_NUMBER),
      employeePool: numbers.filter(n => OFFICIAL_NUMBERS.slice(2).includes(n.phoneNumber)).length,
    };

    return NextResponse.json({
      success: true,
      numbers,
      stats,
      officialRange: { start: '01805020100', end: '01805020119', total: 20 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Super Admin or Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const { phoneNumber, displayName, ownerType, employeeOwnerId, branch, department, metaPhoneNumberId, metaBusinessAccountId } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'phoneNumber required' }, { status: 400 });
    }

    // Validate official range
    if (!OFFICIAL_NUMBERS.includes(phoneNumber)) {
      return NextResponse.json({ success: false, error: `Phone must be in official range 01805020100-01805020119` }, { status: 400 });
    }

    const existing = await db.whatsAppOfficialNumber.findUnique({
      where: { phoneNumber },
    });

    const previous = existing ? { ...existing } : {};

    const updated = await db.whatsAppOfficialNumber.upsert({
      where: { phoneNumber },
      update: {
        displayName: displayName || existing?.displayName || '',
        ownerType: ownerType || existing?.ownerType || 'EMPLOYEE',
        employeeOwnerId: employeeOwnerId || existing?.employeeOwnerId || '',
        branch: branch || existing?.branch || '',
        department: department || existing?.department || '',
        metaPhoneNumberId: metaPhoneNumberId || existing?.metaPhoneNumberId || '',
        metaBusinessAccountId: metaBusinessAccountId || existing?.metaBusinessAccountId || '',
        connectionStatus: metaPhoneNumberId ? 'connected' : existing?.connectionStatus || 'disconnected',
      },
      create: {
        phoneNumber,
        normalizedPhone: phoneNumber.replace(/\D/g, '').startsWith('01') ? '880' + phoneNumber.replace(/\D/g, '') : phoneNumber.replace(/\D/g, ''),
        displayName: displayName || '',
        ownerType: ownerType || 'EMPLOYEE',
        employeeOwnerId: employeeOwnerId || '',
        branch: branch || '',
        department: department || '',
        metaPhoneNumberId: metaPhoneNumberId || '',
        metaBusinessAccountId: metaBusinessAccountId || '',
        connectionStatus: metaPhoneNumberId ? 'connected' : 'disconnected',
        activeStatus: 'active',
      },
    });

    // Audit log
    await db.whatsAppNumberAssignmentAudit.create({
      data: {
        numberId: updated.id,
        phoneNumber,
        changedById: auth.userId,
        changedByName: auth.name || '',
        changedByRole: auth.roles[0] || '',
        previousOwnerType: (previous as any).ownerType || '',
        newOwnerType: updated.ownerType,
        previousEmployee: (previous as any).employeeOwnerId || '',
        newEmployee: updated.employeeOwnerId,
        previousBranch: (previous as any).branch || '',
        newBranch: updated.branch,
        previousValue: JSON.stringify(previous),
        newValue: JSON.stringify(updated),
        reason: body.reason || 'Number configuration updated',
        ipAddress: req.headers.get('x-forwarded-for') || '',
        userAgent: req.headers.get('user-agent') || '',
      },
    });

    await db.aloAuditLog.create({
      data: {
        actorType: auth.roles[0] || 'admin',
        actorName: auth.name || auth.userId,
        action: 'WHATSAPP_NUMBER_ASSIGNMENT',
        resource: 'WhatsAppOfficialNumber',
        resourceId: updated.id,
        details: JSON.stringify({ phoneNumber, ownerType, branch, previous }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
