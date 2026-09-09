import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

function generateStudentId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ALO-S-${year}${random}`;
}

function generatePartnerId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ALO-P-${year}${random}`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, portalType } = body;

    if (!name || !email || !password || !portalType) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, password, and portalType are required.",
        },
        { status: 400 }
      );
    }

    // Validate email format on server side
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Employees cannot self-register
    if (portalType === "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Employee registration is not allowed. Contact admin.",
        },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.portalUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Determine user type and status based on portal type
    let userType: string;
    let status: string;

    if (portalType === "student") {
      userType = "STUDENT";
      status = "active";
    } else if (portalType === "partner") {
      userType = "PARTNER";
      status = "pending";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid portal type." },
        { status: 400 }
      );
    }

    // Hash the password with bcrypt before storing
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create the portal user
    const user = await db.portalUser.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: phone?.trim() || "",
        passwordHash,
        userType,
        status,
        firstLoginRequired: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        status: true,
        firstLoginRequired: true,
      },
    });

    // Create the corresponding profile
    if (portalType === "student") {
      // Generate a unique student ID with retry on collision
      let studentId = generateStudentId();
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await db.portalStudentProfile.findUnique({
          where: { studentId },
        });
        if (!existing) {
          isUnique = true;
        } else {
          studentId = generateStudentId();
          attempts++;
        }
      }

      await db.portalStudentProfile.create({
        data: {
          userId: user.id,
          studentId,
          fullName: name.trim(),
        },
      });
    } else if (portalType === "partner") {
      // Generate a unique partner ID with retry on collision
      let partnerId = generatePartnerId();
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await db.partnerProfile.findUnique({
          where: { partnerId },
        });
        if (!existing) {
          isUnique = true;
        } else {
          partnerId = generatePartnerId();
          attempts++;
        }
      }

      await db.partnerProfile.create({
        data: {
          userId: user.id,
          partnerId,
          contactPerson: name.trim(),
        },
      });
    }

    const message =
      portalType === "partner"
        ? "Account created successfully. Your account is pending admin approval."
        : "Account created successfully";

    return NextResponse.json(
      {
        success: true,
        user,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
