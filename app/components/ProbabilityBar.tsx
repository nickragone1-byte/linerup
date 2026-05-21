interface Props {
  awayProb: number;
  homeProb: number;
  pickedTeam: "away" | "home";
}

export default function ProbabilityBar({ awayProb, homeProb, pickedTeam }: Props) {
  const awayPct = Math.round(awayProb);
  const homePct = 100 - awayPct;

  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden" style={{ height: 6, background: "#1a2335" }}>
        <div
          style={{
            width: `${awayPct}%`,
            background: pickedTeam === "away" ? "#00e088" : "#2a3548",
            transition: "width 0.3s ease",
          }}
        />
        <div
          style={{
            width: `${homePct}%`,
            background: pickedTeam === "home" ? "#00e088" : "#2a3548",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: pickedTeam === "away" ? "#ffffff" : "#c9d1d9",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {awayPct}%
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: pickedTeam === "home" ? "#ffffff" : "#c9d1d9",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {homePct}%
        </span>
      </div>
    </div>
  );
}
