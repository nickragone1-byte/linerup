interface Props {
  generatedAt: string;
  mobile?: boolean;
}

function fmtTime(generatedAt: string): string {
  // "2026-05-21 09:00:00 PDT" → extract "09:00:00" and format as "9:00 AM"
  const timePart = generatedAt.split(" ")[1]; // "09:00:00"
  if (!timePart) return "";
  const [hStr, mStr] = timePart.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${mStr} ${period}`;
}

export default function UpdatedLabel({ generatedAt, mobile = false }: Props) {
  if (!generatedAt) return null;

  const timeStr = fmtTime(generatedAt);
  if (!timeStr) return null;

  if (mobile) {
    return (
      <div style={{ fontSize: 12, color: "#7d8590", marginTop: 2 }}>
        Updated at {timeStr}
      </div>
    );
  }
  return (
    <span style={{ fontSize: 13, color: "#7d8590" }}>· Updated at {timeStr}</span>
  );
}
