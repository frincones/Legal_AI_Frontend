import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon generado por código (marca aurora con "J"). Sin archivo binario.
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
          background: "linear-gradient(135deg,#7B6CF6 0%,#4F7BFF 45%,#21C7D8 100%)",
          borderRadius: 7,
          color: "#fff",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        J
      </div>
    ),
    { ...size },
  );
}
