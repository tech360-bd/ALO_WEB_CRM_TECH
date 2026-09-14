/**
 * UniversityPromo Composition
 * Data-driven university promo video
 * Uses Remotion + ALO branding
 */

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  Easing,
} from "remotion";

interface UniversityPromoProps {
  universityName: string;
  country: string;
  ranking?: string;
  courses?: string[];
  logoUrl?: string;
  images?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  studentName?: string;
  cta?: string;
  brand?: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export const UniversityPromo: React.FC<UniversityPromoProps> = ({
  universityName = "University of Manchester",
  country = "UK",
  ranking = "#28 QS World",
  courses = ["MSc Data Science", "MSc AI", "MSc Cyber Security"],
  logoUrl = "/brand/alo-logo.png",
  images = [],
  primaryColor = "#E8501A",
  secondaryColor = "#0057B8",
  studentName = "",
  cta = "Apply for 2027 Intake",
  brand,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logo = brand?.logoUrl || logoUrl;
  const primary = brand?.primaryColor || primaryColor;
  const secondary = brand?.secondaryColor || secondaryColor;

  // Animations
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
  const rankingOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const coursesOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 120, fps, config: { damping: 80 } });
  const ctaOpacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: secondary, fontFamily: "Inter, sans-serif" }}>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${secondary} 0%, #003d85 100%)`,
        }}
      />

      {/* Campus images background with Ken Burns */}
      {images[0] && (
        <AbsoluteFill style={{ opacity: 0.15 }}>
          <Img
            src={images[0]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 1.1])})`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Logo */}
      <Img
        src={logo}
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 140,
          height: 60,
          objectFit: "contain",
        }}
      />

      {/* Country badge */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          backgroundColor: primary,
          color: "white",
          padding: "8px 20px",
          borderRadius: 999,
          fontSize: 18,
          fontWeight: 800,
          opacity: rankingOpacity,
        }}
      >
        {country} • {ranking}
      </div>

      {/* Main content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
            maxWidth: 1200,
            transform: `translateY(${interpolate(titleY, [0, 1], [50, 0])}px)`,
            opacity: titleOpacity,
          }}
        >
          {studentName && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "white",
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Personalized for {studentName}
            </div>
          )}

          <h1
            style={{
              color: "white",
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {universityName}
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 28,
              fontWeight: 500,
              margin: 0,
              opacity: rankingOpacity,
            }}
          >
            {ranking} • Study in {country}
          </p>

          {/* Courses */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 20,
              opacity: coursesOpacity,
            }}
          >
            {courses.map((course, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.2)",
                  transform: `translateY(${interpolate(
                    spring({ frame: frame - 60 - i * 5, fps, config: { damping: 100 } }),
                    [0, 1],
                    [20, 0]
                  )}px)`,
                  opacity: interpolate(frame - 60 - i * 5, [0, 15], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {course}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            backgroundColor: primary,
            color: "white",
            padding: "18px 40px",
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 800,
            boxShadow: "0 8px 30px rgba(232,80,26,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {cta} <span>→</span>
        </div>
      </div>

      {/* ALO watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        ALO Education • 2027 Intake
      </div>
    </AbsoluteFill>
  );
};

export default UniversityPromo;
