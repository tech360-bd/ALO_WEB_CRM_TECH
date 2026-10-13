import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

/**
 * Partner self-service settings endpoint.
 * GET  /partner/api/settings  → returns the partner record for the authenticated user
 * PUT  /partner/api/settings  → updates company info, contact, bank, and preferences
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.user.userType !== 'partner' || !auth.user.referenceId) {
      return NextResponse.json({ error: 'Not a partner account' }, { status: 403 })
    }

    const partner = await db.partner.findUnique({
      where: { id: auth.user.referenceId },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 })
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Partner settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.user.userType !== 'partner' || !auth.user.referenceId) {
      return NextResponse.json({ error: 'Not a partner account' }, { status: 403 })
    }

    const body = await request.json()

    // Allowlist of fields the partner can self-update
    const allowed = [
      'companyName', 'contactPerson', 'phone', 'whatsappNumber', 'address',
      'city', 'country', 'website', 'businessType', 'panNumber', 'gstNumber',
      'bankName', 'bankAccount', 'bankBranch', 'ifscCode', 'swiftCode',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.partner.update({
      where: { id: auth.user.referenceId },
      data: updateData,
    })

    // Persist notification preferences as a Setting record (JSON)
    if (body.notificationPreferences && typeof body.notificationPreferences === 'object') {
      const value = JSON.stringify(body.notificationPreferences)
      const existingSetting = await db.setting.findUnique({
        where: { key: `partner_notifications_${auth.user.referenceId}` },
      }).catch(() => null)

      if (existingSetting) {
        await db.setting.update({
          where: { key: `partner_notifications_${auth.user.referenceId}` },
          data: { value },
        })
      } else {
        await db.setting.create({
          data: {
            key: `partner_notifications_${auth.user.referenceId}`,
            value,
            group: 'partner_preferences',
          },
        }).catch(() => {})
      }
    }

    // Persist payout preferences similarly
    if (body.payoutPreferences && typeof body.payoutPreferences === 'object') {
      const value = JSON.stringify(body.payoutPreferences)
      const existing = await db.setting.findUnique({
        where: { key: `partner_payout_${auth.user.referenceId}` },
      }).catch(() => null)

      if (existing) {
        await db.setting.update({
          where: { key: `partner_payout_${auth.user.referenceId}` },
          data: { value },
        })
      } else {
        await db.setting.create({
          data: {
            key: `partner_payout_${auth.user.referenceId}`,
            value,
            group: 'partner_preferences',
          },
        }).catch(() => {})
      }
    }

    return NextResponse.json({ partner: updated })
  } catch (error) {
    console.error('Partner settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
