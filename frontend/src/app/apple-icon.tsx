import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #064E3B 0%, #032E23 100%)",
          borderRadius: "40px",
          border: "4px solid #E8D3AA",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: "bold",
            fontSize: "105px",
            color: "#FFF8EC",
            lineHeight: 1,
            marginTop: "-5px",
          }}
        >
          C
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}

