'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home, Search, Users, GraduationCap, BarChart3, MessageSquare,
  Video, Globe, LayoutDashboard, Zap, FileText, Send,
  CreditCard, Brain, Sparkles, CheckCircle2, Settings,
  Moon, Sun, Languages, Plus, Mail, Phone, MessageCircle,
  ArrowRight, Clock
} from 'lucide-react';

// Types
interface CommandEntry {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  onNavigate?: (page: string, slug?: string) => void;
}

// Recently used commands (persisted in localStorage)
function getRecentCommands(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('alo-recent-commands') || '[]');
  } catch {
    return [];
  }
}

function setRecentCommands(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('alo-recent-commands', JSON.stringify(ids.slice(0, 5)));
  } catch {
    // ignore
  }
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load recent commands on mount
  useEffect(() => {
    setRecentIds(getRecentCommands());
  }, []);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const executeCommand = useCallback((id: string, action: () => void) => {
    const newRecent = [id, ...recentIds.filter(r => r !== id)].slice(0, 5);
    setRecentIds(newRecent);
    setRecentCommands(newRecent);
    setOpen(false);
    action();
  }, [recentIds]);

  // Define all commands
  const allCommands: CommandEntry[] = [
    // Navigation
    { id: 'nav-home', label: 'Go to Homepage', icon: Home, group: 'Navigation', action: () => onNavigate?.('home') },
    { id: 'nav-dashboard', label: 'Go to Student Dashboard', icon: LayoutDashboard, group: 'Navigation', action: () => onNavigate?.('student-dashboard') },
    { id: 'nav-crm', label: 'Go to CRM Dashboard', icon: BarChart3, group: 'Navigation', action: () => onNavigate?.('crm-dashboard') },
    { id: 'nav-crm-kanban', label: 'Go to CRM Pipeline', icon: LayoutDashboard, group: 'Navigation', action: () => onNavigate?.('crm-kanban') },
    { id: 'nav-students', label: 'Go to Student Info Center', icon: GraduationCap, group: 'Navigation', action: () => onNavigate?.('info-center') },
    { id: 'nav-course-finder', label: 'Go to Course Finder', icon: Search, group: 'Navigation', action: () => onNavigate?.('course-finder') },
    { id: 'nav-destinations', label: 'Go to Destinations', icon: Globe, group: 'Navigation', action: () => onNavigate?.('destinations') },
    { id: 'nav-universities', label: 'Go to Universities', icon: GraduationCap, group: 'Navigation', action: () => onNavigate?.('universities') },
    { id: 'nav-exams', label: 'Go to Exams', icon: FileText, group: 'Navigation', action: () => onNavigate?.('exams') },
    { id: 'nav-blog', label: 'Go to Blog', icon: FileText, group: 'Navigation', action: () => onNavigate?.('blog') },
    { id: 'nav-services', label: 'Go to Services', icon: Zap, group: 'Navigation', action: () => onNavigate?.('services') },
    { id: 'nav-about', label: 'Go to About', icon: Users, group: 'Navigation', action: () => onNavigate?.('about') },
    { id: 'nav-contact', label: 'Go to Contact', icon: Phone, group: 'Navigation', action: () => onNavigate?.('contact') },
    { id: 'nav-video-studio', label: 'Go to Video Studio', icon: Video, group: 'Navigation', action: () => onNavigate?.('video-studio') },
    { id: 'nav-seo', label: 'Go to SEO Dashboard', icon: BarChart3, group: 'Navigation', action: () => onNavigate?.('seo-dashboard') },
    { id: 'nav-omnichannel', label: 'Go to Communications', icon: MessageSquare, group: 'Navigation', action: () => onNavigate?.('omnichannel') },
    { id: 'nav-journey', label: 'Go to Student Journey', icon: ArrowRight, group: 'Navigation', action: () => onNavigate?.('student-journey') },
    { id: 'nav-marketing', label: 'Go to Marketing Kit', icon: Mail, group: 'Navigation', action: () => onNavigate?.('marketing-kit') },

    // Actions
    { id: 'action-lead', label: 'Add New Lead', icon: Plus, group: 'Actions', action: () => onNavigate?.('home') },
    { id: 'action-message', label: 'Send Message', icon: Send, group: 'Actions', action: () => onNavigate?.('omnichannel') },
    { id: 'action-whatsapp', label: 'Send via WhatsApp', icon: MessageCircle, group: 'Actions', action: () => onNavigate?.('omnichannel') },
    { id: 'action-application', label: 'Create Application', icon: FileText, group: 'Actions', action: () => onNavigate?.('student-dashboard') },
    { id: 'action-payment', label: 'Record Payment', icon: CreditCard, group: 'Actions', action: () => onNavigate?.('crm-dashboard') },
    { id: 'action-report', label: 'Generate Report', icon: BarChart3, group: 'Actions', action: () => onNavigate?.('crm-dashboard') },
    { id: 'action-video', label: 'Create Video', icon: Video, group: 'Actions', action: () => onNavigate?.('video-studio') },
    { id: 'action-broadcast', label: 'Send Broadcast', icon: Send, group: 'Actions', action: () => onNavigate?.('omnichannel') },

    // AI
    { id: 'ai-assistant', label: 'Ask AI Assistant', icon: Brain, group: 'AI', action: () => onNavigate?.('ai-assistant') },
    { id: 'ai-sop', label: 'Generate SOP', icon: Sparkles, group: 'AI', action: () => onNavigate?.('cv-sop-builder') },
    { id: 'ai-eligibility', label: 'Check Eligibility', icon: CheckCircle2, group: 'AI', action: () => onNavigate?.('course-finder') },
    { id: 'ai-script', label: 'Generate Video Script', icon: Sparkles, group: 'AI', action: () => onNavigate?.('video-studio') },
    { id: 'ai-study', label: 'AI Study Assistant', icon: Brain, group: 'AI', action: () => onNavigate?.('ai-assistant') },
    { id: 'ai-seo-audit', label: 'Run SEO Audit', icon: Globe, group: 'AI', action: () => onNavigate?.('seo-dashboard') },

    // Settings
    { id: 'settings-theme', label: 'Toggle Theme', icon: Moon, group: 'Settings', shortcut: '⌘+T', action: () => {
      document.documentElement.classList.toggle('dark');
    }},
    { id: 'settings-language', label: 'Change Language', icon: Languages, group: 'Settings', action: () => {/* placeholder */} },
    { id: 'settings-settings', label: 'Open Settings', icon: Settings, group: 'Settings', action: () => {/* placeholder */} },
  ];

  // Group commands
  const groups = ['Recently Used', 'Navigation', 'Actions', 'AI', 'Settings'] as const;
  const recentCommands = recentIds
    .map(id => allCommands.find(c => c.id === id))
    .filter(Boolean) as CommandEntry[];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentCommands.length > 0 && (
          <CommandGroup heading="Recently Used">
            {recentCommands.map(cmd => (
              <CommandItem
                key={cmd.id}
                onSelect={() => executeCommand(cmd.id, cmd.action)}
                className="cursor-pointer"
              >
                <cmd.icon className="h-4 w-4 text-[#6b7280]" />
                <span>{cmd.label}</span>
                <Clock className="h-3 w-3 ml-auto text-[#9ca3af]" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentCommands.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Navigation">
          {allCommands.filter(c => c.group === 'Navigation').map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => executeCommand(cmd.id, cmd.action)}
              className="cursor-pointer"
            >
              <cmd.icon className="h-4 w-4 text-[#6b7280]" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {allCommands.filter(c => c.group === 'Actions').map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => executeCommand(cmd.id, cmd.action)}
              className="cursor-pointer"
            >
              <cmd.icon className="h-4 w-4 text-[#bf4520]" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI">
          {allCommands.filter(c => c.group === 'AI').map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => executeCommand(cmd.id, cmd.action)}
              className="cursor-pointer"
            >
              <cmd.icon className="h-4 w-4 text-[#bf4520]" />
              <span>{cmd.label}</span>
              {cmd.id === 'ai-assistant' && <CommandShortcut>⌘+J</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {allCommands.filter(c => c.group === 'Settings').map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => executeCommand(cmd.id, cmd.action)}
              className="cursor-pointer"
            >
              <cmd.icon className="h-4 w-4 text-[#6b7280]" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
