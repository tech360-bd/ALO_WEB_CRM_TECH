/**
 * ALO Education — Editorial Design System Constants
 *
 * Based on diagram-design repo findings:
 * - Paper background: #f5f5f5
 * - Ink (primary text): #2d3142
 * - Coral accent: #bf4520
 * - No shadows, max 6-10px border-radius
 * - 1-2 coral focal nodes per diagram
 * - Density: 4/10 (generous whitespace)
 * - 44 diagram types supported
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const COLORS = {
  /** Main paper/canvas background */
  paper: '#f5f5f5',
  /** Primary ink — text, strokes, borders */
  ink: '#2d3142',
  /** Coral accent — CTAs, focal nodes, highlights */
  coral: '#bf4520',
  /** Lighter coral for backgrounds/hover states */
  coralLight: '#f5e6e0',
  /** Very light coral for subtle backgrounds */
  coralGhost: '#fdf5f2',
  /** Neutral gray for secondary text */
  gray: '#6b7280',
  /** Light gray for dividers and borders */
  grayLight: '#e5e7eb',
  /** Very light gray for subtle backgrounds */
  grayGhost: '#f9fafb',
  /** White for card backgrounds */
  white: '#ffffff',
  /** Success green */
  success: '#16a34a',
  /** Warning amber */
  warning: '#d97706',
  /** Error red */
  error: '#dc2626',
  /** Info blue (used sparingly) */
  info: '#0284c7',
} as const;

// ─── Tailwind Color Mappings ──────────────────────────────────────────────────

export const TAILWIND_COLORS = {
  paper: 'bg-[#f5f5f5]',
  ink: 'text-[#2d3142]',
  coral: 'text-[#bf4520]',
  coralBg: 'bg-[#bf4520]',
  coralLightBg: 'bg-[#f5e6e0]',
  coralGhostBg: 'bg-[#fdf5f2]',
  grayText: 'text-[#6b7280]',
  grayBorder: 'border-[#e5e7eb]',
  grayGhostBg: 'bg-[#f9fafb]',
} as const;

// ─── Spacing System (4/10 density = generous whitespace) ─────────────────────

export const SPACING = {
  /** 4px — tight internal padding */
  xs: 4,
  /** 8px — component internal padding */
  sm: 8,
  /** 12px — comfortable internal padding */
  md: 12,
  /** 16px — section internal padding */
  lg: 16,
  /** 24px — between related elements */
  xl: 24,
  /** 32px — between sections */
  xxl: 32,
  /** 48px — major section breaks */
  xxxl: 48,
  /** 64px — page-level breaks */
  page: 64,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  /** Page hero heading */
  hero: { size: '3rem', weight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' },
  /** Section heading */
  h1: { size: '2rem', weight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' },
  /** Sub-section heading */
  h2: { size: '1.5rem', weight: 600, lineHeight: 1.3, letterSpacing: '0' },
  /** Card/component heading */
  h3: { size: '1.25rem', weight: 600, lineHeight: 1.4, letterSpacing: '0' },
  /** Small heading / overline */
  h4: { size: '1rem', weight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },
  /** Overline / label text */
  overline: { size: '0.75rem', weight: 600, lineHeight: 1.5, letterSpacing: '0.08em', transform: 'uppercase' as const },
  /** Body text */
  body: { size: '1rem', weight: 400, lineHeight: 1.6, letterSpacing: '0' },
  /** Small text */
  small: { size: '0.875rem', weight: 400, lineHeight: 1.5, letterSpacing: '0' },
  /** Caption / auxiliary text */
  caption: { size: '0.75rem', weight: 400, lineHeight: 1.5, letterSpacing: '0.01em' },
} as const;

// ─── Border Radius (max 6-10px) ──────────────────────────────────────────────

export const RADIUS = {
  /** 2px — subtle rounding for small elements */
  xs: 2,
  /** 4px — inputs, small chips */
  sm: 4,
  /** 6px — cards, containers (preferred) */
  md: 6,
  /** 8px — larger cards, modals */
  lg: 8,
  /** 10px — maximum allowed */
  xl: 10,
  /** 9999px — pill shapes only */
  pill: 9999,
} as const;

// ─── Shadows (NONE — editorial design has no shadows) ────────────────────────

export const SHADOWS = {
  none: 'none',
} as const;

// ─── Animation & Transition ──────────────────────────────────────────────────

export const ANIMATION = {
  /** Default transition duration */
  duration: 300,
  /** Faster transition for micro-interactions */
  durationFast: 150,
  /** Slower transition for reveals */
  durationSlow: 500,
  /** Spring config for emphasis */
  spring: { stiffness: 300, damping: 30 },
  /** Easing curves */
  ease: {
    standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
    decelerate: [0, 0, 0.2, 1] as [number, number, number, number],
    accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
  },
} as const;

// ─── Diagram Design Constraints ──────────────────────────────────────────────

export const DIAGRAM_CONSTRAINTS = {
  /** Maximum coral focal nodes per diagram */
  maxFocalNodes: 2,
  /** Content density (4/10 = generous whitespace) */
  density: 4,
  /** Density scale (out of 10) */
  densityScale: 10,
  /** Node padding multiplier based on density */
  nodePadding: 1.5, // (10 - 4) / 4 ≈ 1.5
  /** Stroke width for SVG lines */
  strokeWidth: 2,
  /** Stroke width for emphasized lines */
  strokeWidthBold: 3,
  /** Arrow size in pixels */
  arrowSize: 8,
  /** Minimum node width */
  minNodeWidth: 120,
  /** Minimum node height */
  minNodeHeight: 44,
  /** Gap between nodes */
  nodeGap: 24,
  /** Gap between lanes */
  laneGap: 16,
} as const;

// ─── Types for Diagram Configurations ────────────────────────────────────────

/** Status of a step/node in a diagram */
export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error';

/** Shape type for flowchart nodes */
export type NodeShape = 'rect' | 'rounded' | 'diamond' | 'circle' | 'pill';

/** Edge type for connections between nodes */
export type EdgeType = 'straight' | 'curved' | 'orthogonal';

/** Edge direction */
export type EdgeDirection = 'forward' | 'backward' | 'bidirectional';

/** A generic diagram node */
export interface DiagramNode {
  id: string;
  label: string;
  description?: string;
  shape?: NodeShape;
  status?: StepStatus;
  icon?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/** A generic diagram edge connecting two nodes */
export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: EdgeType;
  direction?: EdgeDirection;
  dashed?: boolean;
}

/** Flowchart configuration */
export interface FlowchartConfig {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  direction?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  currentStepId?: string;
}

/** Funnel stage */
export interface FunnelStage {
  id: string;
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

/** Funnel configuration */
export interface FunnelConfig {
  stages: FunnelStage[];
  direction?: 'horizontal' | 'vertical';
  showPercentage?: boolean;
  showValue?: boolean;
}

/** Timeline event */
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  status: StepStatus;
  icon?: string;
}

/** Timeline configuration */
export interface TimelineConfig {
  events: TimelineEvent[];
  direction?: 'horizontal' | 'vertical';
}

/** Swimlane actor */
export interface SwimlaneActor {
  id: string;
  label: string;
  color?: string;
}

/** Swimlane step within a lane */
export interface SwimlaneStep {
  id: string;
  actorId: string;
  label: string;
  description?: string;
  status?: StepStatus;
  order: number;
}

/** Swimlane handoff between actors */
export interface SwimlaneHandoff {
  fromStepId: string;
  toStepId: string;
  label?: string;
}

/** Swimlane configuration */
export interface SwimlaneConfig {
  actors: SwimlaneActor[];
  steps: SwimlaneStep[];
  handoffs: SwimlaneHandoff[];
}

/** Pyramid tier */
export interface PyramidTier {
  id: string;
  label: string;
  value: number;
  description?: string;
  color?: string;
}

/** Pyramid configuration */
export interface PyramidConfig {
  tiers: PyramidTier[];
}

/** Stat chip configuration */
export interface StatChipConfig {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
  };
  format?: 'number' | 'currency' | 'percent';
}

/** CTA band configuration */
export interface CtaBandConfig {
  heading: string;
  description?: string;
  primaryAction: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'coral' | 'ink' | 'paper';
}

/** Page hero configuration */
export interface PageHeroConfig {
  overline?: string;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  variant?: 'coral' | 'ink' | 'paper';
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// ─── Helper: Get status color ────────────────────────────────────────────────

export function getStatusColor(status: StepStatus): string {
  switch (status) {
    case 'completed': return COLORS.ink;
    case 'current': return COLORS.coral;
    case 'upcoming': return COLORS.grayLight;
    case 'error': return COLORS.error;
  }
}

/** Get status tailwind classes */
export function getStatusClasses(status: StepStatus): { text: string; bg: string; border: string } {
  switch (status) {
    case 'completed':
      return { text: 'text-[#2d3142]', bg: 'bg-[#2d3142]', border: 'border-[#2d3142]' };
    case 'current':
      return { text: 'text-[#bf4520]', bg: 'bg-[#bf4520]', border: 'border-[#bf4520]' };
    case 'upcoming':
      return { text: 'text-[#6b7280]', bg: 'bg-[#e5e7eb]', border: 'border-[#e5e7eb]' };
    case 'error':
      return { text: 'text-[#dc2626]', bg: 'bg-[#dc2626]', border: 'border-[#dc2626]' };
  }
}
