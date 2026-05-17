interface Props {
  awayProb: number;
  homeProb: number;
  pickedTeam: "away" | "home";
}

export default function ProbabilityBar({ awayProb, homeProb, pickedTeam }: Props) {
  const awayPct = Math.round(awayProb);
  const homePct = Math.round(homeProb);

  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden" style={{ height: 6, background: "#1a2335" }}>
        <div
          style={{
            width: `${awayPct}%`,
            background: pickedTeam === "away" ? "#00e088" : "#1a2335",
            transition: "width 0.3s ease",
          }}
        />
        <div
          style={{
            width: `${homePct}%`,
            background: pickedTeam === "home" ? "#00e088" : "#1a2335",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: pickedTeam === "away" ? "#00e088" : "#8b95a8",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {awayPct}%
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: pickedTeam === "home" ? "#00e088" : "#8b95a8",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {homePct}%
        </span>
      </div>
    </div>
  );
}
