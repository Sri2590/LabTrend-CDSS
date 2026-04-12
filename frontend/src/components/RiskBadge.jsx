export default function RiskBadge({ level }) {
  const colors = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[level] || "bg-gray-100 text-gray-600"}`}>
      {level}
    </span>
  );
}