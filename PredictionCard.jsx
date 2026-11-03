import React from "react";

export default function PredictionCard({
  title,
  value,
  subtitle,
  icon,
  color = "#8B5CF6",
}) {
  return (
    <div
      style={{
        background: "#101d31",
        border: "1px solid #263957",
        borderRadius: "12px",
        padding: "20px",
        minHeight: "145px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: `${color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            color: "#9fb3ce",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      </div>

      {/* VALUE */}
      <div
        style={{
          color: "#ffffff",
          fontSize: "27px",
          fontWeight: 700,
          marginBottom: "7px",
        }}
      >
        {value}
      </div>

      {/* SUBTITLE */}
      {subtitle && (
        <div
          style={{
            color: "#8fa3c0",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}