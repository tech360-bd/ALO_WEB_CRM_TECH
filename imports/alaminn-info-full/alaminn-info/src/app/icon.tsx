import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";
export const alt = "Alaminn.info favicon";

/**
 * Programmatically generated favicon (served at /icon). This complements
 * the static `/public/favicon.svg` (referenced in metadata.icons) and
 * ensures a raster fallback for browsers that prefer PNG favicons.
 *
 * The design mirrors favicon.svg: a deep-blue gradient rounded square
 * with an orange core node and faint constellation lines.
 */
export default function Icon() {
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
          borderRadius: 8,
          fontSize: 22,
          fontWeight: 800,
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 9999,
            background: "linear-gradient(135deg, #D84A06 0%, #FF751F 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: 9999,
            border: "1.5px solid rgba(117,181,255,0.5)",
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
