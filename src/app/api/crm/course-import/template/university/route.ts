import { NextResponse } from 'next/server';
import { UNIVERSITY_COLUMNS } from '@/lib/crm/import-constants';

export async function GET() {
  const headers = UNIVERSITY_COLUMNS.join(',');

  const sample1 = [
    'DO_NOT_UPLOAD_SAMPLE_DATA',
    'University of Example',
    'United Kingdom',
    'London',
    '10',
    '50',
    'Public',
    '1900',
    '25000',
    '8000',
    '6.5',
    '150',
    '£18,000 - £35,000',
    'TRUE',
    'A leading research university in the heart of London.',
    'TRUE',
    'https://example.ac.uk',
  ];

  const sample2 = [
    'DO_NOT_UPLOAD_SAMPLE_DATA',
    'Example Institute of Technology',
    'Australia',
    'Melbourne',
    '25',
    '120',
    'Public',
    '1965',
    '18000',
    '6000',
    '6.0',
    '200',
    'A$30,000 - A$50,000',
    'TRUE',
    'A modern university focused on technology and innovation.',
    'FALSE',
    'https://exampleit.edu.au',
  ];

  const csvLines: string[] = [];
  csvLines.push(headers);
  csvLines.push(sample1.map((v) => (v.includes(',') || v.includes('£') || v.includes('A$') ? `"${v}"` : v)).join(','));
  csvLines.push(sample2.map((v) => (v.includes(',') || v.includes('£') || v.includes('A$') ? `"${v}"` : v)).join(','));

  const csv = csvLines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="university_import_template.csv"',
    },
  });
}