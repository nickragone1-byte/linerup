export interface TeamInfo {
  id: number | string;   // MLB: numeric CDN id; NBA: ESPN abbrev string
  abbr: string;
  sport?: "mlb" | "nba"; // defaults to "mlb" for backward compatibility
}

// ── MLB teams ────────────────────────────────────────────────────────────────
const MLB_TEAMS: Record<string, TeamInfo> = {
  "Arizona Diamondbacks":  { id: 109, abbr: "ARI" },
  "Atlanta Braves":        { id: 144, abbr: "ATL" },
  "Athletics":             { id: 133, abbr: "ATH" }, // Oakland/Sacramento Athletics
  "Baltimore Orioles":     { id: 110, abbr: "BAL" },
  "Boston Red Sox":        { id: 111, abbr: "BOS" },
  "Chicago Cubs":          { id: 112, abbr: "CHC" },
  "Chicago White Sox":     { id: 145, abbr: "CWS" },
  "Cincinnati Reds":       { id: 113, abbr: "CIN" },
  "Cleveland Guardians":   { id: 114, abbr: "CLE" },
  "Colorado Rockies":      { id: 115, abbr: "COL" },
  "Detroit Tigers":        { id: 116, abbr: "DET" },
  "Houston Astros":        { id: 117, abbr: "HOU" },
  "Kansas City Royals":    { id: 118, abbr: "KC"  },
  "Los Angeles Angels":    { id: 108, abbr: "LAA" },
  "Los Angeles Dodgers":   { id: 119, abbr: "LAD" },
  "Miami Marlins":         { id: 146, abbr: "MIA" },
  "Milwaukee Brewers":     { id: 158, abbr: "MIL" },
  "Minnesota Twins":       { id: 142, abbr: "MIN" },
  "New York Mets":         { id: 121, abbr: "NYM" },
  "New York Yankees":      { id: 147, abbr: "NYY" },
  "Oakland Athletics":     { id: 133, abbr: "OAK" },
  "Philadelphia Phillies": { id: 143, abbr: "PHI" },
  "Pittsburgh Pirates":    { id: 134, abbr: "PIT" },
  "San Diego Padres":      { id: 135, abbr: "SD"  },
  "San Francisco Giants":  { id: 137, abbr: "SF"  },
  "Seattle Mariners":      { id: 136, abbr: "SEA" },
  "St. Louis Cardinals":   { id: 138, abbr: "STL" },
  "Tampa Bay Rays":        { id: 139, abbr: "TB"  },
  "Texas Rangers":         { id: 140, abbr: "TEX" },
  "Toronto Blue Jays":     { id: 141, abbr: "TOR" },
  "Washington Nationals":  { id: 120, abbr: "WSH" },
};

// ── NBA teams (ESPN CDN: a.espncdn.com/i/teamlogos/nba/500/{abbr}.png) ───────
const NBA_TEAMS: Record<string, TeamInfo> = {
  "Atlanta Hawks":            { id: "atl",  abbr: "ATL", sport: "nba" },
  "Boston Celtics":           { id: "bos",  abbr: "BOS", sport: "nba" },
  "Brooklyn Nets":            { id: "bkn",  abbr: "BKN", sport: "nba" },
  "Charlotte Hornets":        { id: "cha",  abbr: "CHA", sport: "nba" },
  "Chicago Bulls":            { id: "chi",  abbr: "CHI", sport: "nba" },
  "Cleveland Cavaliers":      { id: "cle",  abbr: "CLE", sport: "nba" },
  "Dallas Mavericks":         { id: "dal",  abbr: "DAL", sport: "nba" },
  "Denver Nuggets":           { id: "den",  abbr: "DEN", sport: "nba" },
  "Detroit Pistons":          { id: "det",  abbr: "DET", sport: "nba" },
  "Golden State Warriors":    { id: "gsw",  abbr: "GSW", sport: "nba" },
  "Houston Rockets":          { id: "hou",  abbr: "HOU", sport: "nba" },
  "Indiana Pacers":           { id: "ind",  abbr: "IND", sport: "nba" },
  "LA Clippers":              { id: "lac",  abbr: "LAC", sport: "nba" },
  "Los Angeles Lakers":       { id: "lal",  abbr: "LAL", sport: "nba" },
  "Memphis Grizzlies":        { id: "mem",  abbr: "MEM", sport: "nba" },
  "Miami Heat":               { id: "mia",  abbr: "MIA", sport: "nba" },
  "Milwaukee Bucks":          { id: "mil",  abbr: "MIL", sport: "nba" },
  "Minnesota Timberwolves":   { id: "min",  abbr: "MIN", sport: "nba" },
  "New Orleans Pelicans":     { id: "nop",  abbr: "NOP", sport: "nba" },
  "New York Knicks":          { id: "nyk",  abbr: "NYK", sport: "nba" },
  "Oklahoma City Thunder":    { id: "okc",  abbr: "OKC", sport: "nba" },
  "Orlando Magic":            { id: "orl",  abbr: "ORL", sport: "nba" },
  "Philadelphia 76ers":       { id: "phi",  abbr: "PHI", sport: "nba" },
  "Phoenix Suns":             { id: "phx",  abbr: "PHX", sport: "nba" },
  "Portland Trail Blazers":   { id: "por",  abbr: "POR", sport: "nba" },
  "Sacramento Kings":         { id: "sac",  abbr: "SAC", sport: "nba" },
  "San Antonio Spurs":        { id: "sas",  abbr: "SAS", sport: "nba" },
  "Toronto Raptors":          { id: "tor",  abbr: "TOR", sport: "nba" },
  "Utah Jazz":                { id: "utah", abbr: "UTA", sport: "nba" },
  "Washington Wizards":       { id: "wsh",  abbr: "WSH", sport: "nba" },
};

const TEAMS: Record<string, TeamInfo> = { ...MLB_TEAMS, ...NBA_TEAMS };

export function getTeamInfo(name: string): TeamInfo | null {
  return TEAMS[name] ?? null;
}

export function getTeamLogoUrl(info: TeamInfo): string {
  if (info.sport === "nba") {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${info.id}.png`;
  }
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${info.id}.svg`;
}

export function teamAbbr(name: string): string {
  return TEAMS[name]?.abbr ?? name.slice(0, 3).toUpperCase();
}
