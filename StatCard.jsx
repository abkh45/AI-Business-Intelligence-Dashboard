export default function StatCard({
  title,
  value,
  growth = 0,
  color = "#6957F5",
  icon,
}) {
  const growthValue = Number(growth) || 0;

  return (
    <div className="stat-card">

      {/* ICON */}
      <div
        className="stat-icon"
        style={{
          background: color,
          boxShadow: `0 8px 20px ${color}45`,
        }}
      >
        {icon}
      </div>

      {/* CONTENT */}
      <div className="stat-content">

        {/* TITLE */}
        <p className="stat-title">
          {title}
        </p>

        {/* VALUE */}
        <h2 className="stat-value">
          {value}
        </h2>

        {/* GROWTH */}
        <div className="stat-growth">

          <span
            className={
              growthValue >= 0
                ? "growth-positive"
                : "growth-negative"
            }
          >
            {growthValue >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(growthValue).toFixed(1)}%
          </span>

          <span className="growth-label">
            vs last month
          </span>

        </div>

      </div>

    </div>
  );
}