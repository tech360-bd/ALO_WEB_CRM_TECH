# Production Startup and Health Report

- Command: HOSTNAME=127.0.0.1 PORT=3210 ... npm start
- Server status: production-start_running=YES pid=51143
shutdown=OK

## HTTP results
```csv
route,status,content-type
/,200,
/student/login,200,
/partner/login,200,
/employee/login,200,
/admin/login,404,
/admin/ai-command-center,200,
/crm/inbox,200,
/api/health,200,content-type: application/json
/api/crm/ucc/conversations,401,content-type: application/json
```

## Startup output
```text
> alo-education-erp@0.3.0 start
> NODE_ENV=production node .next/standalone/server.js

▲ Next.js 16.2.12
- Local:         http://127.0.0.1:3210
- Network:       http://127.0.0.1:3210
✓ Ready in 0ms
```
