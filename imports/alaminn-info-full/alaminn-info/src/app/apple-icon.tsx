import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";
export const alt = "Alaminn.info apple touch icon";

/**
 * Apple touch icon (served at /apple-icon). Apple recommends a 180x180
 * PNG with no transparency for the home-screen icon.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06162F 0%, #0B63CE 55%, #1677E8 100%)",
          borderRadius: 38,
          fontSize: 110,
          fontWeight: 800,
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            background: "linear-gradient(135deg, #D84A06 0%, #FF751F 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 32,
            borderRadius: 9999,
            border: "6px solid rgba(117,181,255,0.5)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
