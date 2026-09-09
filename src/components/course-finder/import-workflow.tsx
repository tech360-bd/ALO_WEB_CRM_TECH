'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, ChevronRight, ChevronLeft, Check, X,
  AlertTriangle, XCircle, CheckCircle2, Copy, Download,
  ArrowRight, Loader2, RotateCcw, FileDown, FileText,
  ClipboardCheck, BarChart3, Shield, PartyPopper, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { ValidationResult, ValidationRowError } from './types';

type ImportType =
  | 'course_finder_combined'
  | 'university_master'
  | 'scholarship_update'
  | 'commission_update'
  | 'requirements_update';

const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  course_finder_combined: 'Course Finder Combined Upload',
  university_master: 'University Master Upload',
  scholarship_update: 'Scholarship Update',
  commission_update: 'Commission Update',
  requirements_update: 'Requirements Update',
};

const SYSTEM_FIELDS = [
  'University Name', 'Course Title', 'Country', 'City', 'Study Level',
  'Duration', 'Tuition Fee', 'Tuition Currency', 'Intake', 'IELTS Min',
  'PTE Min', 'Scholarship Available', 'Scholarship Details', 'Source URL',
  'Subject Area', 'Commission Expected', 'Commission Increased', 'Commission Partner',
];

const STEP_CONFIG = [
  { id: 1, label: 'Upload', icon: Upload },
  { id: 2, label: 'Import Type', icon: FileSpreadsheet },
  { id: 3, label: 'Column Map', icon: Copy },
  { id: 4, label: 'Preview', icon: Search },
  { id: 5, label: 'Validate', icon: ClipboardCheck },
  { id: 6, label: 'Summary', icon: BarChart3 },
  { id: 7, label: 'Row Errors', icon: AlertTriangle },
  { id: 8, label: 'Confirm', icon: Shield },
  { id: 9, label: 'Progress', icon: Loader2 },
  { id: 10, label: 'Result', icon: CheckCircle2 },
  { id: 11, label: 'Audit', icon: FileText },
  { id: 12, label: 'Done', icon: PartyPopper },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center gap-0.5 overflow-x-auto pb-2">
        {STEP_CONFIG.map((step, idx) => {
          const Icon = step.icon;
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1 min-w-[56px]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isComplete ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span
                  className={`text-[10px] whitespace-nowrap ${
                    isCurrent ? 'font-semibold text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEP_CONFIG.length - 1 && (
                <div
                  className={`w-4 sm:w-8 h-0.5 mx-0.5 mt-[-14px] ${
                    currentStep > step.id ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Step {currentStep} of 12
          </span>
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 text-xs"
          >
            {STEP_CONFIG[currentStep - 1].label}
          </Badge>
        </div>
        <Progress
          value={(currentStep / 12) * 100}
          className="[&_[data-slot=progress-indicator]]:bg-emerald-600 h-2"
        />
      </div>
    </div>
  );
}

function severityColor(severity: string) {
  switch (severity) {
    case 'error': return 'bg-red-100 text-red-700';
    case 'warning': return 'bg-amber-100 text-amber-700';
    case 'blocked': return 'bg-red-200 text-red-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

export function ImportWorkflow() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('course_finder_combined');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [batchId, setBatchId] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    skipped: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Upload
  const handleFileSelect = (f: File) => {
    setFile(f);
    // Simulate parsing CSV headers
    const mockHeaders = [
      'University', 'Course Name', 'Nation', 'Level', 'Duration',
      'Annual Fee', 'Currency', 'Intake Month', 'IELTS Score', 'PTE Score',
      'Has Scholarship', 'Source Link', 'Subject', 'City',
    ];
    setCsvHeaders(mockHeaders);

    // Auto-map columns
    const autoMap: Record<string, string> = {};
    const mapRules: Record<string, string> = {
      'University': 'University Name',
      'Course Name': 'Course Title',
      'Nation': 'Country',
      'Level': 'Study Level',
      'Annual Fee': 'Tuition Fee',
      'Currency': 'Tuition Currency',
      'Intake Month': 'Intake',
      'IELTS Score': 'IELTS Min',
      'PTE Score': 'PTE Min',
      'Has Scholarship': 'Scholarship Available',
      'Source Link': 'Source URL',
      'Subject': 'Subject Area',
      'City': 'City',
    };
    mockHeaders.forEach((h) => {
      autoMap[h] = mapRules[h] || '';
    });
    setColumnMapping(autoMap);

    // Simulate preview rows
    const mockRows: string[][] = [
      ['University of Manchester', 'MSc Data Science', 'UK', 'Postgraduate', '1 year', '32000', 'GBP', 'Sep 2025', '6.5', '65', 'Yes', 'https://manchester.ac.uk', 'Computer Science', 'Manchester'],
      ['University of Toronto', 'BSc Computer Engineering', 'Canada', 'Undergraduate', '4 years', '58000', 'CAD', 'Sep 2025', '6.5', '60', 'No', 'https://utoronto.ca', 'Engineering', 'Toronto'],
      ['Monash University', 'Master of Business', 'Australia', 'Postgraduate', '2 years', '42000', 'AUD', 'Feb 2026', '6.0', '50', 'Yes', 'https://monash.edu', 'Business & Management', 'Melbourne'],
      ['TU Munich', 'MSc Informatics', 'Germany', 'Postgraduate', '2 years', '5000', 'EUR', 'Oct 2025', '6.5', '65', 'No', 'https://tum.de', 'Computer Science', 'Munich'],
      ['University College Dublin', 'BBA', 'Ireland', 'Undergraduate', '3 years', '22000', 'EUR', 'Sep 2025', '6.5', '60', 'Yes', 'https://ucd.ie', 'Business & Management', 'Dublin'],
    ];
    setPreviewRows(mockRows);
    setStep(2);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      handleFileSelect(droppedFile);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  // Step 5: Validation
  const runValidation = async () => {
    setValidating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mockValidation: ValidationResult = {
      total: 245,
      valid: 198,
      warnings: 22,
      blocked: 12,
      duplicates: 8,
      unknownUniversity: 3,
      missingSource: 5,
      errors: [
        { row: 5, field: 'Tuition Fee', message: 'Non-numeric tuition fee value', severity: 'error' },
        { row: 12, field: 'Country', message: 'Country not in supported list: "Holland"', severity: 'error' },
        { row: 18, field: 'IELTS Min', message: 'IELTS score out of range (0-9)', severity: 'blocked' },
        { row: 23, field: 'Study Level', message: 'Unrecognized study level: "Masters"', severity: 'warning' },
        { row: 34, field: 'Course Title', message: 'Duplicate course detected', severity: 'warning' },
        { row: 45, field: 'University Name', message: 'Unknown university: "Harvard Cambridge"', severity: 'error' },
        { row: 56, field: 'Source URL', message: 'Missing source URL for verification', severity: 'warning' },
        { row: 67, field: 'Duration', message: 'Invalid duration format', severity: 'blocked' },
        { row: 78, field: 'Tuition Fee', message: 'Fee seems unusually low: 100', severity: 'warning' },
        { row: 89, field: 'Country', message: 'Empty country field', severity: 'blocked' },
        { row: 102, field: 'Intake', message: 'Intake date in the past', severity: 'warning' },
        { row: 134, field: 'PTE Min', message: 'PTE score exceeds maximum of 90', severity: 'error' },
      ],
    };
    setValidationResult(mockValidation);
    setValidating(false);
    setStep(6);
  };

  // Step 9: Import
  const startImport = async () => {
    setImporting(true);
    setStep(9);

    // Simulate progress
    const total = validationResult?.valid || 198;
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= total) {
        current = total;
        clearInterval(interval);
        setImporting(false);
        setImportResult({
          success: true,
          imported: 195,
          failed: 3,
          skipped: 47,
        });
        setBatchId(`BATCH-${Date.now().toString(36).toUpperCase()}`);
        setStep(10);
      }
      setImportProgress(Math.round((current / total) * 100));
    }, 300);
  };

  // Step 10: Rollback
  const handleRollback = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Import rolled back successfully');
    setStep(1);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setBatchId('');
    setImportProgress(0);
  };

  const handleNewImport = () => {
    setStep(1);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setBatchId('');
    setImportProgress(0);
  };

  const canGoNext = () => {
    switch (step) {
      case 1: return false; // auto-advances
      case 2: return !!importType;
      case 3: return Object.values(columnMapping).filter(Boolean).length > 0;
      case 4: return true;
      case 5: return false; // has action button
      case 6: return true;
      case 7: return true;
      case 8: return true;
      case 9: return false;
      case 10: return true;
      case 11: return true;
      case 12: return false;
      default: return true;
    }
  };

  const goNext = () => {
    if (step === 5) {
      runValidation();
      return;
    }
    if (step === 8) {
      startImport();
      return;
    }
    if (step < 12) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">CSV Import Workflow</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Import course, university, and scholarship data from CSV files
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <StepIndicator currentStep={step} />

        <Card className="border-slate-200">
          <CardContent className="p-6">
            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Upload CSV File</h2>
                <p className="text-sm text-slate-500">
                  Drag and drop your CSV file or click to browse. Supported format: .csv
                </p>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
                >
                  <Upload className="size-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-600">
                    Drop your CSV file here, or <span className="text-emerald-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">CSV files up to 50MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}

            {/* Step 2: Import Type */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Select Import Type</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose the type of data you are importing
                  </p>
                </div>
                {file && (
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                    <FileSpreadsheet className="size-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
                <RadioGroup
                  value={importType}
                  onValueChange={(v) => setImportType(v as ImportType)}
                  className="space-y-3"
                >
                  {(Object.entries(IMPORT_TYPE_LABELS) as [ImportType, string][]).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        importType === value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <RadioGroupItem value={value} className="border-emerald-600 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-800">{label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Column Mapping */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Column Mapping</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Map your CSV columns to the system fields. Auto-mapped columns are pre-filled.
                  </p>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-3">
                          CSV Column
                        </th>
                        <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider p-3 w-12">
                          →
                        </th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-3">
                          System Field
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvHeaders.map((header) => (
                        <tr key={header} className="border-b border-slate-100 last:border-0">
                          <td className="p-3">
                            <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {header}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-300">
                            <ArrowRight className="size-4 mx-auto" />
                          </td>
                          <td className="p-3">
                            <Select
                              value={columnMapping[header] || ''}
                              onValueChange={(v) =>
                                setColumnMapping((prev) => ({ ...prev, [header]: v }))
                              }
                            >
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="— Skip —" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__skip__">— Skip Column —</SelectItem>
                                {SYSTEM_FIELDS.map((field) => (
                                  <SelectItem key={field} value={field}>
                                    {field}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Data Preview</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Showing first {previewRows.length} rows of your file
                  </p>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <ScrollArea className="max-h-96">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="p-2 text-left font-medium text-slate-500 w-10">#</th>
                          {csvHeaders.map((h) => (
                            <th
                              key={h}
                              className="p-2 text-left font-medium text-slate-500 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="p-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Step 5: Validation */}
            {step === 5 && (
              <div className="space-y-6 text-center py-8">
                <h2 className="text-lg font-semibold text-slate-900">Run Validation</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Run validation to check your data for errors, warnings, and duplicates before importing.
                </p>
                <Button
                  onClick={runValidation}
                  disabled={validating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                >
                  {validating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="size-4 mr-2" />
                      Run Validation
                    </>
                  )}
                </Button>
                {validating && (
                  <p className="text-sm text-slate-400 animate-pulse">
                    Checking {validationResult?.total || '...'} rows...
                  </p>
                )}
              </div>
            )}

            {/* Step 6: Validation Summary */}
            {step === 6 && validationResult && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Validation Summary</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Review the validation results before proceeding
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <Card className="p-4 border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{validationResult.total}</div>
                    <div className="text-xs text-slate-500 mt-1">Total Rows</div>
                  </Card>
                  <Card className="p-4 border-emerald-200 bg-emerald-50">
                    <div className="text-2xl font-bold text-emerald-700">{validationResult.valid}</div>
                    <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Valid
                    </div>
                  </Card>
                  <Card className="p-4 border-amber-200 bg-amber-50">
                    <div className="text-2xl font-bold text-amber-700">{validationResult.warnings}</div>
                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="size-3" /> Warnings
                    </div>
                  </Card>
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="text-2xl font-bold text-red-700">{validationResult.blocked}</div>
                    <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle className="size-3" /> Blocked
                    </div>
                  </Card>
                  <Card className="p-4 border-orange-200 bg-orange-50">
                    <div className="text-2xl font-bold text-orange-700">{validationResult.duplicates}</div>
                    <div className="text-xs text-orange-600 mt-1">Duplicates</div>
                  </Card>
                  <Card className="p-4 border-slate-200">
                    <div className="text-2xl font-bold text-slate-700">{validationResult.unknownUniversity}</div>
                    <div className="text-xs text-slate-500 mt-1">Unknown University</div>
                  </Card>
                  <Card className="p-4 border-slate-200">
                    <div className="text-2xl font-bold text-slate-700">{validationResult.missingSource}</div>
                    <div className="text-xs text-slate-500 mt-1">Missing Source</div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 7: Row Errors */}
            {step === 7 && validationResult && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Row-Level Issues</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {validationResult.errors.length} issues found across your data
                  </p>
                </div>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {validationResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                          {err.row}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-700">
                              {err.field}
                            </span>
                            <Badge className={`text-[10px] ${severityColor(err.severity)}`}>
                              {err.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{err.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Step 8: Confirm */}
            {step === 8 && validationResult && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Confirm Import</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Review the details before starting the import
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Important</p>
                      <p className="mt-1">
                        This will import <strong>{validationResult.valid} rows</strong> into the system.
                        {validationResult.warnings > 0 && ` ${validationResult.warnings} rows with warnings will be imported with default values.`}
                        {validationResult.blocked > 0 && ` ${validationResult.blocked} blocked rows will be skipped.`}
                      </p>
                      <p className="mt-2">This action cannot be easily undone.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Import Type</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">
                      {IMPORT_TYPE_LABELS[importType]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">File</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">
                      {file?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Rows to Import</p>
                    <p className="text-sm font-bold text-emerald-600 text-lg mt-0.5">
                      {validationResult.valid}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Rows to Skip</p>
                    <p className="text-sm font-bold text-red-600 text-lg mt-0.5">
                      {validationResult.blocked + validationResult.duplicates}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Progress */}
            {step === 9 && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <Loader2 className="size-10 text-emerald-600 animate-spin mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-slate-900">Importing Data...</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Please do not close this page while the import is in progress
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium text-emerald-600">{importProgress}%</span>
                  </div>
                  <Progress
                    value={importProgress}
                    className="h-3 [&_[data-slot=progress-indicator]]:bg-emerald-600"
                  />
                  <p className="text-xs text-slate-400 text-center">
                    Processing rows...
                  </p>
                </div>
              </div>
            )}

            {/* Step 10: Result */}
            {step === 10 && importResult && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  {importResult.success ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="size-8 text-emerald-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Import Successful</h2>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="size-8 text-red-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">Import Completed with Errors</h2>
                    </>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Batch ID:</span>
                    <code className="text-sm font-mono font-medium text-slate-800 bg-white px-2 py-0.5 rounded border">
                      {batchId}
                    </code>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-xl font-bold text-emerald-600">{importResult.imported}</div>
                      <div className="text-xs text-slate-500">Imported</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-xs text-slate-500">Failed</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-xl font-bold text-slate-600">{importResult.skipped}</div>
                      <div className="text-xs text-slate-500">Skipped</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRollback}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Rollback Import
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Downloading error CSV...')}
                  >
                    <FileDown className="size-3.5 mr-1.5" />
                    Download Error CSV
                  </Button>
                </div>
              </div>
            )}

            {/* Step 11: Audit */}
            {step === 11 && (
              <div className="space-y-4 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="size-8 text-slate-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Audit Log</h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">
                      Audit log created for Batch {batchId}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    All import actions have been recorded with timestamps and user information.
                  </p>
                </div>
              </div>
            )}

            {/* Step 12: Done */}
            {step === 12 && (
              <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="size-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Import Complete!</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Your data has been successfully imported. You can start a new import or view the imported data.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    onClick={handleNewImport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Upload className="size-4 mr-2" />
                    New Import
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Navigating to imported data...')}>
                    <Search className="size-4 mr-2" />
                    View Imported Data
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Downloading report...')}>
                    <Download className="size-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 12 && step !== 9 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 1 || step === 9 || importing}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Back
                </Button>
                {step !== 5 && step !== 8 && (
                  <Button
                    onClick={goNext}
                    disabled={!canGoNext()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                )}
                {step === 8 && (
                  <Button
                    onClick={goNext}
                    disabled={importing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="size-4 mr-1" />
                    Confirm Import
                  </Button>
                )}
              </div>
            )}
            {step === 11 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="size-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Finish
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}