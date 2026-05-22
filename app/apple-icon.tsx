import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#E86A1A",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Cup assembly */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {/* Steam */}
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 18,
                  background: "rgba(255,255,255,0.55)",
                  borderRadius: 2,
                  transform: i === 1 ? "skewX(-8deg)" : i === 0 ? "skewX(8deg)" : "skewX(-8deg)",
                }}
              />
            ))}
          </div>
          {/* Rim */}
          <div
            style={{
              width: 88,
              height: 14,
              background: "white",
              borderRadius: 7,
            }}
          />
          {/* Body + handle row */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Cup body */}
            <div
              style={{
                width: 80,
                height: 62,
                background: "white",
                borderRadius: "0 0 14px 14px",
              }}
            />
            {/* Handle */}
            <div
              style={{
                width: 20,
                height: 36,
                border: "11px solid white",
                borderLeft: "none",
                borderRadius: "0 18px 18px 0",
                marginLeft: -2,
              }}
            />
          </div>
          {/* Saucer */}
          <div
            style={{
              width: 100,
              height: 12,
              background: "white",
              borderRadius: 6,
              marginTop: 6,
            }}
          />
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
