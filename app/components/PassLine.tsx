"use client";

import { useState } from "react";
import type { Game, Tier } from "@/lib/types";

export interface PassItem {
  game: Game;
  internalTier: Tier;
  reason: string;
}

interface Props {
  items: PassItem[];
}

export default function PassLine({ items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-5 pb-2">
      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px" }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="touch-manipulation transition-colors duration-150 flex items-center"
          style={{ fontSize: "13px", color: "#555", minHeight: "44px" }}
        >
          <span style={{ color: "#444" }}>
            {items.length} games where the model has no edge.
          </span>
          <span className="ml-2" style={{ color: open ? "#888" : "#444" }}>
            {open ? "Hide ↑" : "View all →"}
          </span>
        </button>

        {open && (
          <div
            className="mt-4 rounded-lg overflow-hidden"
            style={{ border: "1px solid #1a1a1a", background: "#0a0a0a" }}
          >
            <table className="w-full" style={{ fontSize: "13px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <th
                    className="text-left font-medium uppercase"
                    style={{
                      padding: "10px 16px",
                      fontSize: "10px",
                      color: "#444",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Matchup
                  </th>
                  <th
                    className="text-left font-medium uppercase hidden sm:table-cell"
                    style={{
                      padding: "10px 16px",
                      fontSize: "10px",
                      color: "#444",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Pitchers
                  </th>
                  <th
                    className="text-left font-medium uppercase"
                    style={{
                      padding: "10px 16px",
                      fontSize: "10px",
                      color: "#444",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ game, reason }, i) => (
                  <tr
                    key={`${game.away_team}-${game.home_team}`}
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #111",
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "#666", verticalAlign: "top" }}>
                      <span className="block" style={{ color: "#888" }}>
                        {game.away_team}
                      </span>
                      <span className="block" style={{ color: "#555" }}>
                        @ {game.home_team}
                      </span>
                    </td>
                    <td
                      className="hidden sm:table-cell"
                      style={{ padding: "12px 16px", verticalAlign: "top" }}
                    >
                      <span className="block" style={{ color: "#555" }}>
                        {game.away_pitcher}
                      </span>
                      <span className="block" style={{ color: "#444" }}>
                        {game.home_pitcher}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#555",
                        verticalAlign: "top",
                        fontSize: "12px",
                      }}
                    >
                      {reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
