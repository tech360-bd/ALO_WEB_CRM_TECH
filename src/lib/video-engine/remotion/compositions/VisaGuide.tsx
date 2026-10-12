import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";

export const VisaGuide: React.FC<any> = ({ country = "UK", steps = [{ title: "Offer", duration: "1-2 weeks", icon: "📄" }, { title: "CAS", duration: "1 week", icon: "🎓" }, { title: "Visa", duration: "3 weeks", icon: "🛂" }] }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF", color: "#2563EB", fontFamily: "Inter", padding: 40 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, textAlign: "center" }}>{country} Visa Timeline</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 60 }}>
        {steps.map((s: any, i: number) => {
          const opacity = interpolate(frame - i * 20, [0, 20], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity, textAlign: "center", background: "#F8FAFC", padding: 20, borderRadius: 12, minWidth: 150 }}>
              <div style={{ fontSize: 48 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginTop: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#64748B" }}>{s.duration}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
export default VisaGuide;
