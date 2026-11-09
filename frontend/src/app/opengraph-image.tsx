import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Career OS — Fresher & Recruiter Hiring Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #064E3B 0%, #02261C 100%)",
          color: "#FFF8EC",
          fontFamily: "system-ui, sans-serif",
          border: "12px solid #E8D3AA",
        }}
      >
        {/* Top: Logo & Platform badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "#F8E7C9",
                color: "#064E3B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, serif",
                fontSize: "36px",
                fontWeight: "bold",
              }}
            >
              C
            </div>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "40px",
                fontWeight: "bold",
                color: "#FFF8EC",
                letterSpacing: "-0.02em",
              }}
            >
              Career OS
            </span>
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "rgba(248, 231, 201, 0.15)",
              border: "1px solid #E8D3AA",
              color: "#C8963E",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Hiring Platform
          </div>
        </div>

        {/* Center: Main Heading & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "64px",
              fontWeight: "bold",
              lineHeight: 1.15,
              color: "#FFF8EC",
              margin: 0,
            }}
          >
            The Operating System for Careers &amp; Recruitment.
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#E8D3AA",
              margin: 0,
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            Discover verified fresher opportunities, apply with complete resume privacy, and connect
            directly with modern hiring teams.
          </p>
        </div>

        {/* Bottom: Feature Highlights */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            fontSize: "18px",
            color: "rgba(255, 248, 236, 0.75)",
            borderTop: "1px solid rgba(232, 211, 170, 0.3)",
            paddingTop: "24px",
          }}
        >
          <span>✓ Verified Fresher Roles</span>
          <span>✓ Applicant-Only Resume Privacy</span>
          <span>✓ Real-Time Application Tracking</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

