export interface TeamInfo {
  id: number;
  abbr: string;
}

const TEAMS: Record<string, TeamInfo> = {
  "Arizona Diamondbacks": { id: 109, abbr: "ARI" },
  "Atlanta Braves": { id: 144, abbr: "ATL" },
  "Baltimore Orioles": { id: 110, abbr: "BAL" },
  "Boston Red Sox": { id: 111, abbr: "BOS" },
  "Chicago Cubs": { id: 112, abbr: "CHC" },
  "Chicago White Sox": { id: 145, abbr: "CWS" },
  "Cincinnati Reds": { id: 113, abbr: "CIN" },
  "Cleveland Guardians": { id: 114, abbr: "CLE" },
  "Colorado Rockies": { id: 115, abbr: "COL" },
  "Detroit Tigers": { id: 116, abbr: "DET" },
  "Houston Astros": { id: 117, abbr: "HOU" },
  "Kansas City Royals": { id: 118, abbr: "KC" },
  "Los Angeles Angels": { id: 108, abbr: "LAA" },
  "Los Angeles Dodgers": { id: 119, abbr: "LAD" },
  "Miami Marlins": { id: 146, abbr: "MIA" },
  "Milwaukee Brewers": { id: 158, abbr: "MIL" },
  "Minnesota Twins": { id: 142, abbr: "MIN" },
  "New York Mets": { id: 121, abbr: "NYM" },
  "New York Yankees": { id: 147, abbr: "NYY" },
  "Oakland Athletics": { id: 133, abbr: "OAK" },
  "Philadelphia Phillies": { id: 143, abbr: "PHI" },
  "Pittsburgh Pirates": { id: 134, abbr: "PIT" },
  "San Diego Padres": { id: 135, abbr: "SD" },
  "San Francisco Giants": { id: 137, abbr: "SF" },
  "Seattle Mariners": { id: 136, abbr: "SEA" },
  "St. Louis Cardinals": { id: 138, abbr: "STL" },
  "Tampa Bay Rays": { id: 139, abbr: "TB" },
  "Texas Rangers": { id: 140, abbr: "TEX" },
  "Toronto Blue Jays": { id: 141, abbr: "TOR" },
  "Washington Nationals": { id: 120, abbr: "WSH" },
};

export function getTeamInfo(name: string): TeamInfo | null {
  return TEAMS[name] ?? null;
}

export function getTeamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

export function teamAbbr(name: string): string {
  return TEAMS[name]?.abbr ?? name.slice(0, 3).toUpperCase();
}
