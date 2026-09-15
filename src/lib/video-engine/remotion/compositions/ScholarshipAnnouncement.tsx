import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const ScholarshipAnnouncement: React.FC<any> = ({ title = "£10,000 Scholarship!", university = "University of Example", amount = "£10,000", eligibility = "2:1 + IELTS 6.5", deadline = "31 July 2027", cta = "Apply via ALO" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 80 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#E8501A", justifyContent: "center", alignItems: "center", color: "white", fontFamily: "Inter" }}>
      <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
        <h1 style={{ fontSize: 80, fontWeight: 900 }}>{amount}</h1>
        <h2 style={{ fontSize: 48, fontWeight: 700 }}>{university}</h2>
        <p style={{ fontSize: 24, marginTop: 20 }}>{eligibility} • Deadline: {deadline}</p>
        <div style={{ backgroundColor: "#0057B8", color: "white", padding: "12px 24px", borderRadius: 999, display: "inline-block", marginTop: 20, fontWeight: 800 }}>{cta}</div>
      </div>
    </AbsoluteFill>
  );
};
export default ScholarshipAnnouncement;
