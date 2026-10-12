/**
 * Brand Overlay Utility
 * Ensures all videos have ALO Education branding
 * From marketing automation brand config
 */

import { getVideoEngineConfig } from "../config";

export interface BrandOverlayOptions {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  watermarkEnabled?: boolean;
  watermarkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity?: number;
  scale?: number;
}

export function getBrandOverlayFFmpegFilter(
  options: BrandOverlayOptions = {}
): string {
  const config = getVideoEngineConfig();
  const opts = {
    logoUrl: options.logoUrl || config.brand.logoUrl,
    position: options.watermarkPosition || config.brand.watermarkPosition,
    opacity: options.opacity || 0.8,
    scale: options.scale || 0.15, // 15% of video width
  };

  // Position mapping
  const positionMap = {
    "top-left": "10:10",
    "top-right": "W-w-10:10",
    "bottom-left": "10:H-h-10",
    "bottom-right": "W-w-10:H-h-10",
  };

  const pos = positionMap[opts.position] || positionMap["bottom-right"];
  
  // FFmpeg filter: scale logo, set opacity, overlay
  return `[1:v]scale=iw*${opts.scale}:ih*${opts.scale}[logo];[0:v][logo]overlay=${pos}:format=auto,format=yuv420p`;
}

export function getBrandOverlayCommand(
  inputVideo: string,
  logoPath: string,
  outputPath: string,
  options: BrandOverlayOptions = {}
): string {
  const filter = getBrandOverlayFFmpegFilter(options);
  return `ffmpeg -i ${inputVideo} -i ${logoPath} -filter_complex "${filter}" -codec:a copy ${outputPath}`;
}

// ─── Remotion brand overlay component code ──────────────────────────

export function getRemotionBrandOverlayCode(): string {
  return `
import { Img, AbsoluteFill } from "remotion";

export const BrandOverlay: React.FC<{
  logoUrl?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  primaryColor?: string;
}> = ({ 
  logoUrl = "/brand/alo-logo.png", 
  position = "bottom-right",
  primaryColor = "#F97316"
}) => {
  const positionStyles = {
    "top-left": { top: 20, left: 20 },
    "top-right": { top: 20, right: 20 },
    "bottom-left": { bottom: 20, left: 20 },
    "bottom-right": { bottom: 20, right: 20 },
  };
  
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img
        src={logoUrl}
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          objectFit: "contain",
          opacity: 0.9,
          ...positionStyles[position],
        }}
      />
      {/* Optional: ALO text watermark */}
      <div style={{
        position: "absolute",
        ...positionStyles[position],
        top: position.includes("bottom") ? undefined : 160,
        bottom: position.includes("top") ? undefined : 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "white",
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 14,
        fontWeight: 700,
      }}>
        ALO Education
      </div>
    </AbsoluteFill>
  );
};
`;
}

export const BRAND_GUIDELINES = {
  logo: {
    url: "/brand/alo-logo.png",
    transparent: true,
    minWidth: 80,
    clearSpace: 20,
  },
  colors: {
    primary: "#F97316",
    secondary: "#2563EB",
    white: "#FFFFFF",
    black: "#000000",
  },
  watermark: {
    enabled: true,
    position: "bottom-right",
    opacity: 0.9,
    scale: 0.15,
  },
  compliance: [
    "All marketing videos must have logo overlay",
    "Logo must not be stretched or distorted",
    "Clear space around logo = 20px min",
    "Primary color for CTAs, secondary for backgrounds",
    "No other logos without approval",
  ],
};
