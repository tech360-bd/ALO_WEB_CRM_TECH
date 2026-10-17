import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";

export const Testimonial: React.FC<any> = ({ studentName = "Ahmed Rahman", country = "BD → UK", university = "Manchester", course = "MSc CS", quote = "ALO made my dream reality!", photoUrl = "", rating = 5 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#0057B8", justifyContent: "center", alignItems: "center", color: "white", fontFamily: "Inter" }}>
      <div style={{ opacity, textAlign: "center", padding: 40 }}>
        {photoUrl && <Img src={photoUrl} style={{ width: 120, height: 120, borderRadius: 999, margin: "0 auto" }} />}
        <h2 style={{ fontSize: 48, fontWeight: 800, marginTop: 20 }}>{studentName}</h2>
        <p style={{ fontSize: 20, opacity: 0.8 }}>{country} • {university} • {course}</p>
        <p style={{ fontSize: 28, fontStyle: "italic", marginTop: 20, maxWidth: 800 }}>"{quote}"</p>
        <p style={{ fontSize: 24, color: "#FFD700", marginTop: 10 }}>{"★".repeat(rating)}</p>
      </div>
    </AbsoluteFill>
  );
};
export default Testimonial;
