#!/usr/bin/env tsx
// Script to add API fetch pattern to CRM pages still using mock data
// Run: npx tsx scripts/fix-crm-mock-pages.ts

import * as fs from 'fs';
import * as path from 'path';

const BASE = '/home/z/my-project/src/components/crm/pages';

interface Fix {
  file: string;
  mockVar: string;
  apiUrl: string;
  mockArrayType: string;
  fields: Record<string, string>;
}

const fixes: Fix[] = [
  {
    file: 'CrmHRMPage.tsx',
    mockVar: 'mockEmployees',
    apiUrl: '/api/crm/hrm',
    mockArrayType: 'Employee[]',
    fields: {
      'id': 'id', 'empId': 'employeeId', 'name': 'name',
      'department': 'department', 'designation': 'designation',
      'branch': 'branch', 'status': 'status', 'joinDate': 'joinedAt'
    }
  },
  {
    file: 'CrmAuditLogsPage.tsx',
    mockVar: 'mockLogs',
    apiUrl: '/api/crm/audit-logs',
    mockArrayType: 'AuditLog[]',
    fields: {
      'id': 'id', 'timestamp': 'createdAt', 'user': 'actorUserId',
      'role': 'actorRole', 'action': 'action', 'resource': 'entityType',
      'details': 'metadata', 'ip': 'ipAddress'
    }
  }
];

for (const fix of fixes) {
  const filePath = path.join(BASE, fix.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${fix.file} not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if it already fetches from API
  if (content.includes("fetch('" + fix.apiUrl) || content.includes(`fetch("${fix.apiUrl}`)) {
    console.log(`SKIP: ${fix.file} already fetches from API`);
    continue;
  }
  
  console.log(`FIXING: ${fix.file}`);
  
  // Add useEffect and useState imports if not present
  if (!content.includes('useEffect')) {
    content = content.replace(
      "import { useState }",
      "import { useState, useEffect, useCallback }"
    );
  }
  
  // Add usePortalStore import if not present
  if (!content.includes('usePortalStore')) {
    content = content.replace(
      "import { usePortalStore",
      "import { usePortalStore"
    );
    if (!content.includes('usePortalStore')) {
      content = content.replace(
        "import { useState",
        "import { useState, useEffect, useCallback } from 'react';\nimport { usePortalStore } from '@/lib/stores/portal-store';"
      );
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  DONE: ${fix.file}`);
}

console.log('\nAll fixes applied.');
