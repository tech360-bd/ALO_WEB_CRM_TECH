/**
 * ALO diagram library — editorial SVG diagrams, branded to the ALO palette.
 *
 * Design system source: cathrynlavery/diagram-design (re-skinned per its
 * onboarding rule — never ship default-skinned diagrams into a branded site).
 *
 * Generic types: ProcessDiagram, JourneyMapDiagram, FunnelDiagram,
 * TimelineDiagram, FlowDiagram.
 * ALO compositions: alo-diagrams.tsx (application process, student journey,
 * eligibility flow, marketing funnel, intake timeline).
 */

export { diagramTokens, diagramType, diagramTypeClasses } from './tokens';
export type { DiagramToken } from './tokens';
export {
  DiagramConnector,
  DiagramEyebrow,
  DiagramNode,
  DiagramRoot,
  DiagramRule,
  DiagramArrowDefs,
  roundedOrthoPath,
  rectCenter,
} from './primitives';
export type { DiagramPoint, DiagramRect, ArrowTone, DiagramNodeTone } from './primitives';
export { default as ProcessDiagram, processDiagramSize } from './ProcessDiagram';
export type { ProcessLane, ProcessStep, ProcessNodeSpec, ProcessArrow } from './ProcessDiagram';
export { default as JourneyMapDiagram } from './JourneyMapDiagram';
export type { JourneyStage, JourneySentiment } from './JourneyMapDiagram';
export { default as FunnelDiagram } from './FunnelDiagram';
export type { FunnelStage } from './FunnelDiagram';
export { default as TimelineDiagram } from './TimelineDiagram';
export type { TimelineEvent } from './TimelineDiagram';
export { default as FlowDiagram } from './FlowDiagram';
export type { FlowNode, FlowNodeKind, FlowLink, FlowSide } from './FlowDiagram';
export {
  ApplicationProcessDiagram,
  StudentJourneyMapDiagram,
  EligibilityFlowDiagram,
  MarketingFunnelDiagram,
  IntakeTimelineDiagram,
} from './alo-diagrams';
