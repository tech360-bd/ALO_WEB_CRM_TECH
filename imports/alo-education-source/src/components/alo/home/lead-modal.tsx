'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  CheckCircle,
  GraduationCap,
  Globe,
  Award,
  Loader2,
  ShieldCheck,
  Send,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DESTINATIONS = [
  { value: 'UK', label: 'United Kingdom' },
  { value: 'USA', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Germany', label: 'Germany' },
  { value: 'UAE', label: 'UAE' },
  { value: 'Other', label: 'Other' },
];

const STUDY_LEVELS = [
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Undergraduate', label: 'Undergraduate' },
  { value: 'Masters', label: 'Masters' },
  { value: 'PhD', label: 'PhD' },
];

/* ------------------------------------------------------------------ */
/*  Stagger animation                                                   */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const fadeField = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  Illustration panel (Tab 1 left side)                                */
/* ------------------------------------------------------------------ */

function IllustrationPanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center w-[200px] lg:w-[220px] shrink-0 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#003d7a] p-6 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full border border-white/10" />

      {/* Icons pattern */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-8 w-8" />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Globe className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Award className="h-6 w-6" />
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs font-medium text-white/70 leading-relaxed">
          Expert guidance for your study abroad journey
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile blue header strip                                            */
/* ------------------------------------------------------------------ */

function MobileHeaderStrip() {
  return (
    <div className="flex md:hidden items-center justify-center gap-3 rounded-t-xl bg-gradient-to-r from-[#0066CC] to-[#003d7a] py-5 px-4">
      <GraduationCap className="h-6 w-6 text-white" />
      <span className="text-sm font-semibold text-white">
        Free Consultation
      </span>
      <Globe className="h-5 w-5 text-white/70" />
      <Award className="h-5 w-5 text-white/70" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success State                                                       */
/* ------------------------------------------------------------------ */

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 text-lg font-bold text-[#0A0A0A]"
      >
        Thank you!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-sm text-[#555555] leading-relaxed max-w-xs"
      >
        Our counsellor will contact you within 2 hours.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <Button
          onClick={onClose}
          variant="outline"
          className="mt-6 rounded-lg border-slate-200 text-sm font-medium"
        >
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Consultation Form (Tab 1)                                           */
/* ------------------------------------------------------------------ */

function ConsultationForm({
  defaultName,
  defaultInterest,
  onSuccess,
}: {
  defaultName?: string;
  defaultInterest?: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState(defaultInterest || '');
  const [studyLevel, setStudyLevel] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        setError('Please enter a valid phone number (at least 8 characters).');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!destination) {
        setError('Please select a study destination.');
        return;
      }
      if (!studyLevel) {
        setError('Please select a study level.');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            destination,
            studyLevel,
            message: message.trim() || undefined,
            source: 'consultation_modal',
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Something went wrong. Please try again.');
          return;
        }

        onSuccess();
      } catch {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [name, phone, email, destination, studyLevel, message, onSuccess],
  );

  const fieldVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <MobileHeaderStrip />

      <div className="flex gap-5 p-5 md:p-6">
        {/* Left illustration on desktop */}
        <IllustrationPanel />

        {/* Form fields */}
        <motion.div
          className="flex-1 space-y-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key="consultation"
        >
          {/* Full Name */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="lead-name" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lead-name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20"
              autoComplete="name"
            />
          </motion.div>

          {/* Phone */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="lead-phone" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20"
              autoComplete="tel"
            />
          </motion.div>

          {/* Email */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="lead-email" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20"
              autoComplete="email"
            />
          </motion.div>

          {/* Destination & Study Level row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={fieldVariants}>
              <Label className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
                Study Destination <span className="text-red-500">*</span>
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200 text-sm focus:ring-[#F37021]/20">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <Label className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
                Study Level <span className="text-red-500">*</span>
              </Label>
              <Select value={studyLevel} onValueChange={setStudyLevel}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200 text-sm focus:ring-[#F37021]/20">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Message */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="lead-message" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Message <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="lead-message"
              placeholder="Tell us about your study plans..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20 resize-none"
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.div variants={fieldVariants}>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#F37021] text-sm font-bold text-white hover:bg-[#D45A10] active:bg-[#c85a15] shadow-lg shadow-[#F37021]/20 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Book My Free Consultation'
              )}
            </Button>
          </motion.div>

          {/* Trust text */}
          <motion.div
            variants={fieldVariants}
            className="flex flex-col items-center gap-1 pt-1"
          >
            <span className="flex items-center gap-1 text-[11px] text-[#555555]">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              Your information is secure. We never share your data.
            </span>
            <span className="text-[11px] text-slate-400">
              Free consultation, no obligations
            </span>
          </motion.div>
        </motion.div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Enquiry Form (Tab 2)                                          */
/* ------------------------------------------------------------------ */

function QuickEnquiryForm({
  defaultName,
  onSuccess,
}: {
  defaultName?: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your name (at least 2 characters).');
        return;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        setError('Please enter a valid phone number (at least 8 characters).');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            message: message.trim() || undefined,
            source: 'quick_enquiry',
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Something went wrong. Please try again.');
          return;
        }

        onSuccess();
      } catch {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [name, phone, message, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="p-5 md:p-6">
        <motion.div
          className="space-y-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key="quick-enquiry"
        >
          {/* Name */}
          <motion.div variants={fadeField}>
            <Label htmlFor="qe-name" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="qe-name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20"
              autoComplete="name"
            />
          </motion.div>

          {/* Phone */}
          <motion.div variants={fadeField}>
            <Label htmlFor="qe-phone" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="qe-phone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20"
              autoComplete="tel"
            />
          </motion.div>

          {/* Message */}
          <motion.div variants={fadeField}>
            <Label htmlFor="qe-message" className="text-xs font-semibold text-[#0A0A0A] mb-1.5 block">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="qe-message"
              placeholder="How can we help you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="rounded-lg border-slate-200 text-sm focus:border-[#F37021]/50 focus:ring-[#F37021]/20 resize-none"
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.div variants={fadeField}>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#F37021] text-sm font-bold text-white hover:bg-[#D45A10] active:bg-[#c85a15] shadow-lg shadow-[#F37021]/20 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Enquiry
                </span>
              )}
            </Button>
          </motion.div>

          {/* Trust text */}
          <motion.div
            variants={fadeField}
            className="flex justify-center pt-1"
          >
            <span className="flex items-center gap-1 text-[11px] text-[#555555]">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              Your information is secure. We never share your data.
            </span>
          </motion.div>
        </motion.div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Lead Modal Component                                           */
/* ------------------------------------------------------------------ */

export function LeadModal({
  open,
  onOpenChange,
  defaultName,
  defaultInterest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultInterest?: string;
}) {
  const [activeTab, setActiveTab] = useState('consultation');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = useCallback(() => {
    setShowSuccess(true);

    // Auto-close after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab('consultation');
      onOpenChange(false);
    }, 3000);
  }, [onOpenChange]);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setShowSuccess(false);
        setActiveTab('consultation');
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden gap-0 border-slate-200/80 shadow-2xl">
        {/* sr-only title/description */}
        <DialogTitle className="sr-only">
          Book a Free Consultation — ALO Education
        </DialogTitle>
        <DialogDescription className="sr-only">
          Fill in your details and our expert counsellor will get back to you within 2 hours.
        </DialogDescription>

        {showSuccess ? (
          <SuccessState onClose={() => onOpenChange(false)} />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full rounded-none border-b border-slate-100 bg-transparent p-0 h-12">
              <TabsTrigger
                value="consultation"
                className="flex-1 rounded-none border-b-2 border-transparent text-sm font-semibold text-[#555555] data-[state=active]:border-[#F37021] data-[state=active]:text-[#F37021] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 h-12"
              >
                Book Free Consultation
              </TabsTrigger>
              <TabsTrigger
                value="enquiry"
                className="flex-1 rounded-none border-b-2 border-transparent text-sm font-semibold text-[#555555] data-[state=active]:border-[#F37021] data-[state=active]:text-[#F37021] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 h-12"
              >
                Quick Enquiry
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="consultation" className="mt-0 focus-visible:ring-0 outline-none ring-0">
                  <ConsultationForm
                    defaultName={defaultName}
                    defaultInterest={defaultInterest}
                    onSuccess={handleSuccess}
                  />
                </TabsContent>

                <TabsContent value="enquiry" className="mt-0 focus-visible:ring-0 outline-none ring-0">
                  <QuickEnquiryForm
                    defaultName={defaultName}
                    onSuccess={handleSuccess}
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
