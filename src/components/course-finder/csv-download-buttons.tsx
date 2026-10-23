'use client';

import {
  Download, FileSpreadsheet, FileDown, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DownloadButtonProps {
  label: string;
  url: string;
  filename: string;
  icon?: React.ElementType;
}

function DownloadButton({ label, url, filename, icon: Icon = Download }: DownloadButtonProps) {
  const handleClick = async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error('Failed to download file. Please try again.');
    }
  };

  return (
    <Button
 variant="outline"
 onClick={handleClick}
 className="border-[var(--alo-border)] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-[var(--alo-body)] px-4"
 >
      <Icon className="size-4 mr-2" />
      {label}
    </Button>
  );
}

export function CsvDownloadButtons({ batchId }: { batchId?: string }) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
      <DownloadButton
        label="Course Finder CSV Template"
        url="/api/crm/course-import/template/course"
        filename="course_finder_template.csv"
        icon={FileSpreadsheet}
      />
      <DownloadButton
        label="University Master Template"
        url="/api/crm/course-import/template/university"
        filename="university_master_template.csv"
        icon={FileSpreadsheet}
      />
      <DownloadButton
        label="Sample Course CSV"
        url="/api/crm/course-import/template/course?sample=1"
        filename="sample_course_data.csv"
        icon={Download}
      />
      {batchId && (
        <DownloadButton
          label="Download Error CSV"
          url={`/api/crm/course-import/download-errors?batchId=${batchId}`}
          filename={`errors_${batchId}.csv`}
          icon={FileDown}
        />
      )}
    </div>
  );
}