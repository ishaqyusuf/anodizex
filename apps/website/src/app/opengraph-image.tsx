import { ImageResponse } from "next/og";

export const alt =
  "Anodizex - premium aluminium architectural systems";
export const contentType = "image/png";
export const runtime = "edge";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7fbf7",
        color: "#17232b",
        display: "flex",
        fontFamily: "Arial, Helvetica, sans-serif",
        height: "100%",
        justifyContent: "center",
        padding: 64,
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(23, 35, 43, 0.1) 1px, transparent 0)",
          backgroundSize: "34px 34px",
          display: "flex",
          inset: 0,
          opacity: 0.42,
          position: "absolute",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 155, 152, 0.18), rgba(169, 211, 183, 0.08))",
          borderRadius: 999,
          display: "flex",
          filter: "blur(12px)",
          height: 360,
          position: "absolute",
          right: -92,
          top: -84,
          width: 360,
        }}
      />
      <div
        style={{
          alignItems: "stretch",
          display: "flex",
          gap: 48,
          height: "100%",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: "1 1 0",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 16,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#17232b",
                borderRadius: 18,
                color: "#f7fbf7",
                display: "flex",
                height: 64,
                justifyContent: "center",
                width: 64,
              }}
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="44"
                viewBox="0 0 64 64"
                width="44"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 51V29C50 18.5 41.5 10 31 10S12 18.5 12 29s8.5 19 19 19c5.1 0 9.8-2 13.2-5.3"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="12"
                />
                <circle cx="31" cy="29" fill="#009b98" r="6.5" />
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  letterSpacing: 0,
                  lineHeight: 1,
                }}
              >
                Anodizex
              </div>
              <div
                style={{
                  color: "#52615a",
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Aluminium architectural systems
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 660,
            }}
          >
            <div
              style={{
                color: "#009b98",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 0,
                lineHeight: 1.1,
              }}
            >
              Windows, doors, sliding systems, facades
            </div>
            <div
              style={{
                fontSize: 70,
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 0.98,
              }}
            >
              Premium aluminium systems for modern buildings.
            </div>
            <div
              style={{
                color: "#52615a",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.24,
              }}
            >
              Project-ready glazing, facade, entrance, and opening solutions.
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              color: "#17232b",
              display: "flex",
              fontSize: 24,
              fontWeight: 800,
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#009b98",
                borderRadius: 999,
                display: "flex",
                height: 12,
                width: 12,
              }}
            />
            anodizex.com
          </div>
        </div>

        <div
          style={{
            alignItems: "stretch",
            background: "#ffffff",
            border: "2px solid rgba(23, 35, 43, 0.1)",
            borderRadius: 28,
            boxShadow: "0 28px 80px rgba(23, 35, 43, 0.16)",
            display: "flex",
            flex: "0 0 388px",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              alignItems: "center",
              borderBottom: "2px solid rgba(23, 35, 43, 0.08)",
              display: "flex",
              gap: 10,
              height: 64,
              padding: "0 24px",
            }}
          >
            {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
              <div
                key={color}
                style={{
                  background: color,
                  borderRadius: 999,
                  display: "flex",
                  height: 13,
                  width: 13,
                }}
              />
            ))}
            <div
              style={{
                color: "#69766f",
                fontSize: 16,
                fontWeight: 800,
                marginLeft: 10,
              }}
            >
              Project roadmap
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 24,
            }}
          >
            {[
              {
                accent: "#f59e0b",
                label: "2026",
                title: "Sliding systems",
              },
              {
                accent: "#009b98",
                label: "2025",
                title: "Commercial facade",
              },
              {
                accent: "#22c55e",
                label: "2024",
                title: "Entrance doors",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "#f9fcf9",
                  border: "2px solid rgba(23, 35, 43, 0.08)",
                  borderRadius: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    color: item.accent,
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 900,
                    gap: 10,
                    textTransform: "uppercase",
                  }}
                >
                  <div
                    style={{
                      background: item.accent,
                      borderRadius: 999,
                      display: "flex",
                      height: 10,
                      width: 10,
                    }}
                  />
                  {item.label}
                </div>
                <div
                  style={{
                    color: "#17232b",
                    fontSize: 24,
                    fontWeight: 900,
                    lineHeight: 1.05,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    color: "#69766f",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  Completed project
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
