import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// CSV Import Center — preview, validate, import
export async function GET() {
  const batches = await db.importBatch.findMany({
    include: { _count: { select: { errors: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    batches,
    supportedTypes: [
      { type: "courses", columns: "course_code,university_code,name,slug,description,duration_months,tuition_fee,currency,study_level,subject,intake,deadline,status" },
      { type: "universities", columns: "university_code,country_code,name,slug,city,state,website,ranking,overview,status" },
      { type: "scholarships", columns: "scholarship_code,country_code,university_code,name,amount,currency,eligibility,deadline,status" },
      { type: "commissions", columns: "commission_code,partner_id,country_code,university_code,commission_amount,commission_type,currency,claim_stage,visibility,status" },
    ],
  });
}

// POST — parse and validate CSV (simulated), create import batch
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, fileName, csvData, uploadedBy } = body;

  // Parse CSV (simple — split by newlines and commas)
  const lines = csvData.split("\n").filter((l: string) => l.trim());
  const headers = lines[0]?.split(",").map((h: string) => h.trim()) || [];
  const dataRows = lines.slice(1);

  const batch = await db.importBatch.create({
    data: {
      type,
      fileName,
      uploadedBy,
      status: "PROCESSING",
      totalRows: dataRows.length,
    },
  });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const values = dataRows[i].split(",").map((v: string) => v.trim());
    const row: any = {};
    headers.forEach((h: string, j: number) => { row[h] = values[j]; });

    // Validate required fields based on type
    let errors: string[] = [];
    if (type === "courses") {
      if (!row.name) errors.push("Missing course name");
      if (!row.slug) errors.push("Missing slug");
      if (!row.university_code) errors.push("Missing university code");
      if (row.tuition_fee && isNaN(parseFloat(row.tuition_fee))) errors.push("Tuition fee must be numeric");
    }
    if (type === "universities") {
      if (!row.name) errors.push("Missing university name");
      if (!row.slug) errors.push("Missing slug");
    }

    if (errors.length > 0) {
      errorCount++;
      await db.importError.create({
        data: {
          batchId: batch.id,
          rowNumber: i + 2, // +2 because row 1 is header, row 2 is first data
          fieldName: errors[0].split(" ")[1] || "unknown",
          errorMessage: errors.join("; "),
          rawData: JSON.stringify(row),
        },
      });
    } else {
      successCount++;
    }
  }

  await db.importBatch.update({
    where: { id: batch.id },
    data: { status: "COMPLETED", successRows: successCount, errorRows: errorCount },
  });

  return NextResponse.json({
    batch: { ...batch, successRows: successCount, errorRows: errorCount, status: "COMPLETED" },
    message: `Import completed: ${successCount} success, ${errorCount} errors out of ${dataRows.length} rows.`,
    preview: dataRows.slice(0, 5).map((r: string, i: number) => {
      const values = r.split(",").map((v: string) => v.trim());
      const row: any = {};
      headers.forEach((h: string, j: number) => { row[h] = values[j]; });
      return row;
    }),
  });
}
