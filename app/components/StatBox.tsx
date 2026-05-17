interface Stat {
  label: string;
  value: string;
  highlight?: boolean;
}

interface Props {
  stats: Stat[];
}

export default function StatBox({ stats }: Props) {
  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        background: "#1a2335",
        border: "1px solid #1a2335",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center py-3 px-2"
          style={{ background: "#0f1422" }}
        >
          <span
            className="font-mono font-semibold"
            style={{
              fontSize: 18,
              color: stat.highlight ? "#00e088" : "#ffffff",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {stat.value}
          </span>
          <span
            className="uppercase mt-1"
            style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em" }}
          >
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
