import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";

export const CourseExplainer: React.FC<any> = ({ courseName = "MSc Data Science", universityName = "University of Example", duration = "1 Year", fees = "£18,000", scholarship = "Up to £5,000", modules = ["ML", "Big Data", "AI Ethics"], intake = "Sept 2027" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B5ED7", justifyContent: "center", alignItems: "center", color: "white", fontFamily: "Inter" }}>
      <div style={{ opacity, textAlign: "center", padding: 60 }}>
        <h1 style={{ fontSize: 64, fontWeight: 900 }}>{courseName}</h1>
        <p style={{ fontSize: 28 }}>{universityName} • {duration} • {fees}</p>
        <p style={{ fontSize: 24, color: "#F97316", fontWeight: 700 }}>{scholarship} Scholarship • {intake}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          {modules.map((m: string, i: number) => <div key={i} style={{ background: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: 8 }}>{m}</div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
export default CourseExplainer;
