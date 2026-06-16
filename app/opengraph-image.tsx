import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jurovia — Copiloto jurídico verificable";

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
          background: "#15121F",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#FF3D7F,#D23BE0,#7B3DF5,#2F6BFF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 38, fontWeight: 700 }}>J</div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>Jurovia</div>
        </div>
        <div style={{ fontSize: 26, color: "#A9A3BC", marginBottom: 18 }}>Copiloto jurídico verificable</div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Fundamenta con citas verificadas contra las fuentes oficiales.
        </div>
        <div style={{ fontSize: 26, color: "#E8B04B", marginTop: 34 }}>Para abogados de Colombia · Empieza gratis</div>
      </div>
    ),
    { ...size },
  );
}
