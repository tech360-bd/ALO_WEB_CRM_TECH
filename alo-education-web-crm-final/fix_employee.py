import re

def fix_dashboard():
    fp = 'src/components/employee/EmployeeDashboard.tsx'
    with open(fp, 'r') as f:
        content = f.read()
    content = content.replace(
        "fetch('/api/employee/applications?limit=5', { headers }).catch(() => {});",
        """fetch('/api/employee/applications?limit=5', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.applications?.length) setApplicationData(data.applications); }).catch(() => {});"""
    )
    content = content.replace(
        "fetch('/api/employee/reports?section=summary', { headers }).catch(() => {});",
        """fetch('/api/employee/reports?section=summary', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.summary) setReportSummary(data.summary); }).catch(() => {});"""
    )
    content = content.replace(
        'const [taskData, setTaskData] = useState(mockTaskData);',
        'const [taskData, setTaskData] = useState(mockTaskData);\n  const [applicationData, setApplicationData] = useState<any[]>([]);\n  const [reportSummary, setReportSummary] = useState<any>(null);'
    )
    with open(fp, 'w') as f:
        f.write(content)
    print('Fixed Dashboard')

fix_dashboard()
print('Done')
