import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bg = "#E86A1A";

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: bg,
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {/* Steam lines */}
          <div style={{ display: "flex", marginLeft: 18, marginBottom: 8 }}>
            <div style={{ width: 6, height: 22, background: "rgba(255,255,255,0.5)", borderRadius: 3, marginRight: 10 }} />
            <div style={{ width: 6, height: 16, background: "rgba(255,255,255,0.5)", borderRadius: 3, marginTop: 6, marginRight: 10 }} />
            <div style={{ width: 6, height: 22, background: "rgba(255,255,255,0.5)", borderRadius: 3 }} />
          </div>

          {/* Rim */}
          <div style={{ width: 96, height: 14, background: "white", borderRadius: 7 }} />

          {/* Body + handle */}
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {/* Cup body */}
            <div
              style={{
                width: 86,
                height: 66,
                background: "white",
                borderRadius: "0 0 18px 18px",
              }}
            />

            {/*
             * Handle: outer arc (white pill) + inner cutout (bg color)
             * both positioned absolutely inside a relative container
             */}
            <div style={{ position: "relative", display: "flex", width: 32, height: 66 }}>
              {/* Outer arc */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 0,
                  width: 32,
                  height: 46,
                  background: "white",
                  borderRadius: "0 23px 23px 0",
                }}
              />
              {/* Inner cutout — same color as background */}
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  left: 0,
                  width: 20,
                  height: 22,
                  background: bg,
                  borderRadius: "0 11px 11px 0",
                }}
              />
            </div>
          </div>

          {/* Saucer */}
          <div style={{ width: 110, height: 12, background: "white", borderRadius: 6, marginTop: 7 }} />
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
