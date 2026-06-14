import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Juridica — Copiloto jurídico verificable";

// OG image generada por código (sin archivo binario). 1200×630.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0D1320",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#7B6CF6,#4F7BFF,#21C7D8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 34, fontWeight: 700 }}>J</div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Juridica</div>
        </div>
        <div style={{ fontSize: 26, color: "#9AA3B5", marginBottom: 18 }}>Copiloto jurídico verificable</div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Fundamenta con citas verificadas contra las fuentes oficiales.
        </div>
        <div style={{ fontSize: 26, color: "#E8B04B", marginTop: 34 }}>Para abogados de Colombia · Empieza gratis</div>
      </div>
    ),
    { ...size },
  );
}
