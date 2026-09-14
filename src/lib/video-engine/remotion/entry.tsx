/**
 * Remotion Entry - registers all compositions
 * Use: npx remotion studio src/lib/video-engine/remotion/entry.tsx
 *      npx remotion render src/lib/video-engine/remotion/entry.tsx UniversityPromo out/promo.mp4
 */

import { registerRoot } from "remotion";
import { Composition } from "remotion";
import { REMOTION_COMPOSITIONS } from "./index";

// Import actual components
import { UniversityPromo } from "./compositions/UniversityPromo";
import { CourseExplainer } from "./compositions/CourseExplainer";
import { Testimonial } from "./compositions/Testimonial";
import { ScholarshipAnnouncement } from "./compositions/ScholarshipAnnouncement";
import { VisaGuide } from "./compositions/VisaGuide";

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  UniversityPromo,
  CourseExplainer,
  Testimonial,
  ScholarshipAnnouncement,
  VisaGuide,
  // Add more as they are implemented
  CampusTourSlideshow: UniversityPromo, // Placeholder
  IELTSMath: CourseExplainer,
  SuccessStoryRedditStyle: Testimonial,
  FAQShort: ScholarshipAnnouncement,
  AnimatedText: ScholarshipAnnouncement,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {REMOTION_COMPOSITIONS.map((comp) => {
        const Component = COMPONENT_MAP[comp.id] || UniversityPromo;
        return (
          <Composition
            key={comp.id}
            id={comp.id}
            component={Component as any}
            durationInFrames={comp.durationInFrames}
            fps={comp.fps}
            width={comp.width}
            height={comp.height}
            defaultProps={comp.defaultProps}
          />
        );
      })}
    </>
  );
};

registerRoot(RemotionRoot);
