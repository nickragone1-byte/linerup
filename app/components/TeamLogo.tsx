"use client";

import Image from "next/image";
import { useState } from "react";
import { getTeamInfo, getTeamLogoUrl } from "@/lib/teams";

interface Props {
  teamName: string;
  size?: number;
}

export default function TeamLogo({ teamName, size = 48 }: Props) {
  const [failed, setFailed] = useState(false);
  const info = getTeamInfo(teamName);
  const abbr = info?.abbr ?? teamName.slice(0, 3).toUpperCase();
  const innerSize = Math.round(size * 0.7);

  if (!info || failed) {
    return (
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: "#ffffff",
          border: "1px solid #2a3548",
          fontSize: Math.round(size * 0.28),
          fontWeight: 700,
          color: "#1a2335",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        {abbr}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: "#ffffff",
        border: "1px solid #2a3548",
        padding: Math.round(size * 0.15),
      }}
    >
      <Image
        src={getTeamLogoUrl(info.id)}
        alt={teamName}
        width={innerSize}
        height={innerSize}
        onError={() => setFailed(true)}
        style={{ objectFit: "contain", width: "100%", height: "100%", clipPath: "circle(46% at 50% 47%)" }}
        unoptimized
      />
    </div>
  );
}
