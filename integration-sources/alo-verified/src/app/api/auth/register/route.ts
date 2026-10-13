import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    if (type === 'partner') {
      // Partner registration
      const {
        companyName, contactPerson, email, phone, whatsappNumber,
        address, city, country, website, businessType, panNumber,
        bankName, bankAccount, ifscCode
      } = data;

      if (!companyName || !contactPerson || !email) {
        return NextResponse.json(
          { error: 'Company name, contact person, and email are required' },
          { status: 400 }
        );
      }

      // Generate partner ID
      const lastPartner = await db.partner.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { partnerId: true }
      });
      let nextNum = 1;
      if (lastPartner?.partnerId) {
        const numPart = lastPartner.partnerId.split('-')[1];
        if (numPart) nextNum = parseInt(numPart) + 1;
      }
      const partnerId = `AEP-${nextNum.toString().padStart(6, '0')}`;

      const partner = await db.partner.create({
        data: {
          partnerId,
          companyName,
          contactPerson,
          email,
          phone: phone || null,
          whatsappNumber: whatsappNumber || null,
          address: address || null,
          city: city || null,
          country: country || 'Bangladesh',
          website: website || null,
          businessType: businessType || null,
          panNumber: panNumber || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          ifscCode: ifscCode || null,
          commissionRate: 0,
        }
      });

      // Create user account for partner
      const hashedPassword = await hashPassword(data.password || 'ChangeMe@12345');
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: contactPerson,
          phone: phone || null,
          whatsappNumber: whatsappNumber || null,
          userType: 'partner',
          referenceId: partner.id,
          forcePasswordChange: true,
        }
      });

      // Assign partner_staff role
      const partnerRole = await db.role.findFirst({
        where: { name: 'partner_super_admin' }
      });
      if (partnerRole) {
        await db.userRole.create({
          data: {
            userId: user.id,
            roleId: partnerRole.id,
          }
        });
      }

      // Update partner with userId
      await db.partner.update({
        where: { id: partner.id },
        data: { userId: user.id }
      });

      return NextResponse.json({
        message: 'Partner registered successfully',
        partnerId: partner.partnerId,
        userId: user.id,
      }, { status: 201 });

    } else {
      // Student registration
      const {
        firstName, lastName, email, phone, whatsappNumber,
        password, dateOfBirth, nationality, preferredCountry, preferredCourse,
        preferredIntake, englishTestType, englishTestScore, highestEducation, gpa
      } = data;

      if (!firstName || !lastName || !email) {
        return NextResponse.json(
          { error: 'First name, last name, and email are required' },
          { status: 400 }
        );
      }

      // Generate student ID
      const currentYear = new Date().getFullYear();
      const lastStudent = await db.student.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { studentId: true }
      });
      let nextNum = 1;
      if (lastStudent?.studentId) {
        const parts = lastStudent.studentId.split('-');
        if (parts.length >= 2) {
          const numPart = parts[parts.length - 1];
          nextNum = parseInt(numPart) + 1;
        }
      }
      const studentId = `AE-${currentYear}${nextNum.toString().padStart(4, '0')}`;

      const student = await db.student.create({
        data: {
          studentId,
          firstName,
          lastName,
          email,
          phone: phone || null,
          whatsappNumber: whatsappNumber || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          nationality: nationality || null,
          preferredCountry: preferredCountry || null,
          preferredCourse: preferredCourse || null,
          preferredIntake: preferredIntake || null,
          englishTestType: englishTestType || null,
          englishTestScore: englishTestScore || null,
          highestEducation: highestEducation || null,
          gpa: gpa || null,
          source: 'DIRECT',
        }
      });

      // Create user account for student
      const hashedPassword = await hashPassword(password || 'ChangeMe@12345');
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          phone: phone || null,
          whatsappNumber: whatsappNumber || null,
          userType: 'student',
          referenceId: student.id,
          forcePasswordChange: true,
        }
      });

      // Assign student role
      const studentRole = await db.role.findFirst({
        where: { name: 'student' }
      });
      if (studentRole) {
        await db.userRole.create({
          data: {
            userId: user.id,
            roleId: studentRole.id,
          }
        });
      }

      // Update student with userId
      await db.student.update({
        where: { id: student.id },
        data: { userId: user.id }
      });

      return NextResponse.json({
        message: 'Student registered successfully',
        studentId: student.studentId,
        userId: user.id,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
