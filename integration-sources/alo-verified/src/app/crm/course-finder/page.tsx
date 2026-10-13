'use client'

import { PageHeader } from '@/components/alo/portal/PortalPage'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CrmCourseFinderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Finder"
        description="Search 270,000+ programs worldwide with 30+ filters by country, university, tuition, intake, scholarships, and more."
      />
      <Card className="p-6">
        <div className="flex gap-3 mb-4">
          <Input placeholder="Search by course name, keyword, or university..." className="flex-1" />
          <Button className="bg-[#0057B8] hover:bg-[#0049A0]">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {['UK', 'USA', 'Canada', 'Australia', 'Germany', 'Ireland', 'Malaysia', 'Bachelors', 'Masters', 'PhD', 'Scholarships Available', 'September 2026 Intake', 'IELTS 6.5+', 'Low Tuition'].map((f) => (
            <Badge key={f} variant="outline" className="cursor-pointer hover:bg-[#EFF6FF] hover:text-[#0057B8]">
              {f}
            </Badge>
          ))}
        </div>
      </Card>
      <Card className="p-10 text-center border-dashed border-2">
        <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Full course search interface with university partnerships, commission visibility, and shortlisting will be assembled here. Course data is already loaded in the database.
        </p>
      </Card>
    </div>
  )
}
