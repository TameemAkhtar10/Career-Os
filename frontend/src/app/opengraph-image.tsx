import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const alt = "Career OS — Jobs that welcome freshers";
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
          padding: "80px 96px",
          backgroundColor: "#F8E7C9",
          border: "16px solid #E8D3AA",
          boxSizing: "border-box",
        }}
      >
        {/* Top: Logo Mark + Brand Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* Logo Mark: Emerald container with golden/cream letter C */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: "#064E3B",
              border: "3px solid #E8D3AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(6,78,59,0.18)",
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "44px",
                fontWeight: "bold",
                color: "#FFF8EC",
                lineHeight: 1,
                marginTop: "-4px",
              }}
            >
              C
            </span>
          </div>

          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#064E3B",
              letterSpacing: "-0.02em",
            }}
          >
            Career OS
          </span>
        </div>

        {/* Center: Main Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "68px",
              fontWeight: "bold",
              lineHeight: 1.15,
              color: "#064E3B",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Jobs that welcome freshers.
          </h1>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "26px",
              color: "#2D3748",
              margin: 0,
              maxWidth: "920px",
              lineHeight: 1.4,
            }}
          >
            Discover verified entry-level opportunities, apply with complete resume privacy, and track recruitment progress in real time.
          </p>
        </div>

        {/* Bottom: Feature Highlights */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            fontSize: "18px",
            fontWeight: "600",
            color: "#064E3B",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(6, 78, 59, 0.08)",
              border: "1px solid #E8D3AA",
            }}
          >
            <span>✓</span>
            <span>Zero Experience Required</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(6, 78, 59, 0.08)",
              border: "1px solid #E8D3AA",
            }}
          >
            <span>✓</span>
            <span>Applicant-Only Resume Access</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(6, 78, 59, 0.08)",
              border: "1px solid #E8D3AA",
            }}
          >
            <span>✓</span>
            <span>Direct Recruiter Review</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
