"use client";

import Image from "next/image";
import { useState } from "react";
import { getTeamInfo, getTeamLogoUrl } from "@/lib/teams";

interface Props {
  teamName: string;
  size?: number;
}

export default function TeamLogo({ teamName, size = 40 }: Props) {
  const [failed, setFailed] = useState(false);
  const info = getTeamInfo(teamName);
  const abbr = info?.abbr ?? teamName.slice(0, 3).toUpperCase();

  if (!info || failed) {
    return (
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: "#1a2335",
          border: "1px solid #2a3a55",
          fontSize: size * 0.3,
          fontWeight: 700,
          color: "#8b95a8",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded-full overflow-hidden" style={{ width: size, height: size, background: "#0a0e1a" }}>
      <Image
        src={getTeamLogoUrl(info.id)}
        alt={teamName}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ objectFit: "contain" }}
        unoptimized
      />
    </div>
  );
}
