import type { WorldCupDataProvider } from './worldCupDataProvider';
import type { WorldCupGroupId, WorldCupMatchStatus, WorldCupStageId } from '../types/worldCup';
import type {
  WorldCupDisciplinePlayerStat,
  WorldCupDisciplineSummary,
  WorldCupDisciplineTeamStat,
  WorldCupPlayerStat,
  WorldCupRemoteMatch,
  WorldCupRemoteTeam,
  WorldCupStandingGroup,
  WorldCupStandingTeam,
  WorldCupTeamDetail,
  WorldCupTeamSummary,
} from '../types/worldCupCenter';

const FIFA_COMPETITION_ID = '17';
const FIFA_SEASON_ID = '285023';
const FIFA_API_BASE = 'https://api.fifa.com/api/v3';
const FIFA_LANGUAGE = 'en';
const DEFAULT_TIMEOUT_MS = 8000;

const CACHE_TTL = {
  matches: 5 * 60 * 1000,
  standings: 2 * 60 * 1000,
  stats: 60 * 1000,
  teams: 30 * 60 * 1000,
} as const;

const GROUP_IDS: WorldCupGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type FifaLocalizedText = {
  Locale?: string;
  Description?: string;
};

type FifaListResponse<T> = {
  Results?: T[];
};

type FifaTeamPayload = {
  IdTeam?: string;
  IdCountry?: string;
  IdAssociation?: string;
  TeamName?: FifaLocalizedText[];
  Name?: FifaLocalizedText[];
  ShortName?: FifaLocalizedText[];
  Abbreviation?: string;
  ShortClubName?: string;
  IdConfederation?: string;
};

type FifaMatchPayload = {
  IdMatch?: string;
  IdStage?: string;
  IdGroup?: string | null;
  MatchNumber?: number;
  Date?: string;
  StageName?: FifaLocalizedText[];
  GroupName?: FifaLocalizedText[];
  Home?: FifaTeamPayload | null;
  Away?: FifaTeamPayload | null;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
  MatchStatus?: number;
  Stadium?: {
    Name?: FifaLocalizedText[];
    CityName?: FifaLocalizedText[];
  } | null;
};

type FifaLivePlayer = {
  IdPlayer?: string;
  IdTeam?: string;
  PlayerName?: FifaLocalizedText[];
  ShortName?: FifaLocalizedText[];
};

type FifaLiveGoal = {
  IdPlayer?: string;
  IdTeam?: string;
  Minute?: string;
};

type FifaLiveBooking = {
  Card?: number;
  IdPlayer?: string;
  IdTeam?: string;
  Minute?: string;
};

type FifaLiveTeam = FifaTeamPayload & {
  Players?: FifaLivePlayer[];
  Goals?: FifaLiveGoal[];
  Bookings?: FifaLiveBooking[];
};

type FifaLiveMatchPayload = {
  IdMatch?: string;
  HomeTeam?: FifaLiveTeam | null;
  AwayTeam?: FifaLiveTeam | null;
};

const cache = new Map<string, CacheEntry<unknown>>();

const getFromCache = <T>(key: string) => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = <T>(key: string, value: T, ttlMs: number) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const withCache = async <T>(key: string, ttlMs: number, loader: () => Promise<T>) => {
  const cached = getFromCache<T>(key);
  if (cached) return cached;

  const value = await loader();
  setCache(key, value, ttlMs);
  return value;
};

const fetchJson = async <T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`FIFA request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getText = (values?: FifaLocalizedText[], fallback = '') =>
  values?.find((item) => item.Locale === 'en-GB')?.Description ||
  values?.find((item) => item.Description)?.Description ||
  fallback;

const getGroupId = (groupName?: FifaLocalizedText[]): WorldCupGroupId | undefined => {
  const label = getText(groupName);
  const match = label.match(/Group\s+([A-L])/i);
  return GROUP_IDS.includes(match?.[1] as WorldCupGroupId) ? (match?.[1] as WorldCupGroupId) : undefined;
};

const getStageId = (stageName?: FifaLocalizedText[]): WorldCupStageId => {
  const label = getText(stageName).toLowerCase();
  if (label.includes('round of 32')) return 'round-of-32';
  if (label.includes('round of 16')) return 'round-of-16';
  if (label.includes('quarter')) return 'quarter-final';
  if (label.includes('semi')) return 'semi-final';
  if (label.includes('third') || label.includes('play-off')) return 'third-place';
  if (label.includes('final')) return 'final';
  return 'group';
};

const getStageLabel = (stage: WorldCupStageId) => {
  const labels: Record<WorldCupStageId, string> = {
    group: 'Fase de grupos',
    'round-of-32': 'Dieciseisavos de final',
    'round-of-16': 'Octavos de final',
    'quarter-final': 'Cuartos de final',
    'semi-final': 'Semifinal',
    'third-place': 'Tercer puesto',
    final: 'Final',
  };
  return labels[stage];
};

const normalizeTeam = (
  team: FifaTeamPayload | null | undefined,
  group?: WorldCupGroupId
): WorldCupRemoteTeam | null => {
  if (!team?.IdTeam || !team.Abbreviation) return null;

  const name = getText(team.TeamName, team.ShortClubName || team.Abbreviation);
  return {
    id: team.IdTeam,
    code: team.Abbreviation,
    name,
    shortName: team.ShortClubName || name,
    group,
    groupLabel: group ? `Grupo ${group}` : undefined,
    countryCode: team.IdCountry || team.IdAssociation || team.Abbreviation,
  };
};

const getMatchStatus = (match: FifaMatchPayload): WorldCupMatchStatus => {
  const hasScore = typeof match.HomeTeamScore === 'number' && typeof match.AwayTeamScore === 'number';
  const kickoff = match.Date ? Date.parse(match.Date) : Number.NaN;
  const isPastFinishedWindow = Number.isFinite(kickoff) && Date.now() - kickoff > 2.5 * 60 * 60 * 1000;

  if (hasScore && isPastFinishedWindow) return 'finished';
  if (match.MatchStatus === 2) return 'live';
  return 'scheduled';
};

const normalizeMatch = (match: FifaMatchPayload): WorldCupRemoteMatch => {
  const group = getGroupId(match.GroupName);
  const stage = getStageId(match.StageName);
  const homeScore = typeof match.HomeTeamScore === 'number' ? match.HomeTeamScore : undefined;
  const awayScore = typeof match.AwayTeamScore === 'number' ? match.AwayTeamScore : undefined;

  return {
    id: match.IdMatch || '',
    idStage: match.IdStage || '',
    matchNumber: match.MatchNumber || 0,
    kickoffUtc: match.Date || '',
    stage,
    stageLabel: getStageLabel(stage),
    group,
    groupLabel: group ? `Grupo ${group}` : undefined,
    home: normalizeTeam(match.Home, group),
    away: normalizeTeam(match.Away, group),
    homeScore,
    awayScore,
    status: getMatchStatus(match),
    city: getText(match.Stadium?.CityName),
    stadium: getText(match.Stadium?.Name),
  };
};

const matchesUrl = `${FIFA_API_BASE}/calendar/matches?language=${FIFA_LANGUAGE}&count=500&idCompetition=${FIFA_COMPETITION_ID}&idSeason=${FIFA_SEASON_ID}`;

const getMatchDetailUrl = (match: WorldCupRemoteMatch) =>
  `${FIFA_API_BASE}/live/football/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${match.idStage}/${match.id}?language=${FIFA_LANGUAGE}`;

const getTeamDetailUrl = (teamId: string) => `${FIFA_API_BASE}/teams/${teamId}?language=${FIFA_LANGUAGE}`;

const isPlayableTeam = (team: WorldCupRemoteTeam | null): team is WorldCupRemoteTeam =>
  Boolean(team && !team.isPlaceholder && team.id && team.code);

const getFinishedGroupMatches = (matches: WorldCupRemoteMatch[]) =>
  matches.filter(
    (match) =>
      match.stage === 'group' &&
      match.status === 'finished' &&
      isPlayableTeam(match.home) &&
      isPlayableTeam(match.away) &&
      typeof match.homeScore === 'number' &&
      typeof match.awayScore === 'number'
  );

type MutableStanding = Omit<WorldCupStandingTeam, 'position' | 'isDirectQualification' | 'isThirdPlace'>;

const createStanding = (team: WorldCupRemoteTeam, group: WorldCupGroupId): MutableStanding => ({
  team: { ...team, group, groupLabel: `Grupo ${group}` },
  group,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
});

const collectGroupTeams = (matches: WorldCupRemoteMatch[]) => {
  const standings = new Map<WorldCupGroupId, Map<string, MutableStanding>>();

  for (const group of GROUP_IDS) {
    standings.set(group, new Map());
  }

  for (const match of matches) {
    if (match.stage !== 'group' || !match.group) continue;
    const groupMap = standings.get(match.group);
    if (!groupMap) continue;

    for (const team of [match.home, match.away]) {
      if (!isPlayableTeam(team)) continue;
      if (!groupMap.has(team.id)) groupMap.set(team.id, createStanding(team, match.group));
    }
  }

  return standings;
};

const applyResult = (
  team: MutableStanding,
  goalsFor: number,
  goalsAgainst: number
) => {
  team.played += 1;
  team.goalsFor += goalsFor;
  team.goalsAgainst += goalsAgainst;
  team.goalDifference = team.goalsFor - team.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    team.wins += 1;
    team.points += 3;
  } else if (goalsFor === goalsAgainst) {
    team.draws += 1;
    team.points += 1;
  } else {
    team.losses += 1;
  }
};

const sortStandingTeams = (teams: MutableStanding[], hasStarted: boolean) =>
  [...teams].sort((a, b) => {
    if (!hasStarted) return a.team.name.localeCompare(b.team.name, 'es');
    return (
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name, 'es')
    );
  });

const buildStandings = (matches: WorldCupRemoteMatch[]): WorldCupStandingGroup[] => {
  const standings = collectGroupTeams(matches);

  for (const match of getFinishedGroupMatches(matches)) {
    if (!match.group || !match.home || !match.away) continue;
    const groupMap = standings.get(match.group);
    const home = groupMap?.get(match.home.id);
    const away = groupMap?.get(match.away.id);
    if (!home || !away || match.homeScore === undefined || match.awayScore === undefined) continue;

    applyResult(home, match.homeScore, match.awayScore);
    applyResult(away, match.awayScore, match.homeScore);
  }

  return GROUP_IDS.map((group) => {
    const teams = [...(standings.get(group)?.values() || [])];
    const hasStarted = teams.some((team) => team.played > 0);

    return {
      group,
      label: `Grupo ${group}`,
      hasStarted,
      teams: sortStandingTeams(teams, hasStarted).map((team, index) => ({
        ...team,
        position: index + 1,
        isDirectQualification: index < 2,
        isThirdPlace: index === 2,
      })),
    };
  });
};

const getPlayerName = (player: FifaLivePlayer | undefined, fallback: string) =>
  getText(player?.PlayerName, getText(player?.ShortName, fallback));

const getTeamFromLiveMatch = (
  match: WorldCupRemoteMatch,
  teamId?: string
): WorldCupRemoteTeam | null => {
  if (match.home?.id === teamId) return match.home;
  if (match.away?.id === teamId) return match.away;
  return match.home || match.away;
};

const getFinishedMatchesWithTeams = (matches: WorldCupRemoteMatch[]) =>
  matches.filter(
    (match) =>
      match.status === 'finished' &&
      match.idStage &&
      isPlayableTeam(match.home) &&
      isPlayableTeam(match.away)
  );

const fetchLiveMatches = async (matches: WorldCupRemoteMatch[]) => {
  const chunks: WorldCupRemoteMatch[][] = [];
  for (let index = 0; index < matches.length; index += 6) {
    chunks.push(matches.slice(index, index + 6));
  }

  const results: Array<{ match: WorldCupRemoteMatch; live: FifaLiveMatchPayload }> = [];
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (match) => ({
        match,
        live: await fetchJson<FifaLiveMatchPayload>(getMatchDetailUrl(match), DEFAULT_TIMEOUT_MS),
      }))
    );
    results.push(...chunkResults);
  }

  return results;
};

const getLivePlayers = (live: FifaLiveMatchPayload) => [
  ...(live.HomeTeam?.Players || []),
  ...(live.AwayTeam?.Players || []),
];

const getLiveGoals = (live: FifaLiveMatchPayload) => [
  ...(live.HomeTeam?.Goals || []),
  ...(live.AwayTeam?.Goals || []),
];

const getLiveBookings = (live: FifaLiveMatchPayload) => [
  ...(live.HomeTeam?.Bookings || []),
  ...(live.AwayTeam?.Bookings || []),
];

export const fifaWorldCupProvider: WorldCupDataProvider = {
  async getMatches() {
    return withCache('fifa:matches', CACHE_TTL.matches, async () => {
      const payload = await fetchJson<FifaListResponse<FifaMatchPayload>>(matchesUrl);
      return (payload.Results || [])
        .map(normalizeMatch)
        .filter((match) => match.id && match.matchNumber > 0)
        .sort((a, b) => a.matchNumber - b.matchNumber);
    });
  },

  async getStandings() {
    return withCache('fifa:standings', CACHE_TTL.standings, async () => {
      const matches = await this.getMatches();
      return buildStandings(matches);
    });
  },

  async getTeams() {
    return withCache('fifa:teams', CACHE_TTL.teams, async () => {
      const matches = await this.getMatches();
      const standings = await this.getStandings();
      const teamStats = new Map<string, WorldCupStandingTeam>();

      for (const group of standings) {
        for (const standing of group.teams) {
          teamStats.set(standing.team.id, standing);
        }
      }

      const teams = new Map<string, WorldCupTeamSummary>();

      for (const match of matches.filter((item) => item.stage === 'group')) {
        for (const side of ['home', 'away'] as const) {
          const team = match[side];
          if (!isPlayableTeam(team)) continue;

          const existing = teams.get(team.id);
          const standing = teamStats.get(team.id);
          const opponent = side === 'home' ? match.away : match.home;
          const isUpcoming = match.status !== 'finished';
          const nextMatch =
            isUpcoming && opponent
              ? {
                  id: match.id,
                  opponent: opponent.shortName,
                  kickoffUtc: match.kickoffUtc,
                  stageLabel: match.stageLabel,
                  venue: [match.city, match.stadium].filter(Boolean).join(' - '),
                }
              : null;

          if (existing) {
            if (nextMatch && existing.nextMatches.length < 3) existing.nextMatches.push(nextMatch);
            continue;
          }

          teams.set(team.id, {
            team,
            played: standing?.played || 0,
            goalsFor: standing?.goalsFor || 0,
            goalsAgainst: standing?.goalsAgainst || 0,
            points: standing?.points || 0,
            nextMatches: nextMatch ? [nextMatch] : [],
          });
        }
      }

      return [...teams.values()].sort((a, b) => {
        const groupCompare = (a.team.group || 'Z').localeCompare(b.team.group || 'Z');
        return groupCompare || a.team.name.localeCompare(b.team.name, 'es');
      });
    });
  },

  async getScorers() {
    return withCache('fifa:scorers', CACHE_TTL.stats, async () => {
      const matches = getFinishedMatchesWithTeams(await this.getMatches());
      if (matches.length === 0) return [];

      const scorerMap = new Map<string, WorldCupPlayerStat & { matchIds: Set<string> }>();

      for (const { match, live } of await fetchLiveMatches(matches)) {
        const players = getLivePlayers(live);

        for (const goal of getLiveGoals(live)) {
          if (!goal.IdPlayer) continue;
          const player = players.find((item) => item.IdPlayer === goal.IdPlayer);
          const team = getTeamFromLiveMatch(match, goal.IdTeam || player?.IdTeam);
          if (!team) continue;

          const key = `${team.id}:${goal.IdPlayer}`;
          const current =
            scorerMap.get(key) ||
            ({
              id: key,
              playerName: getPlayerName(player, 'Jugador FIFA'),
              team,
              value: 0,
              matchIds: new Set<string>(),
            } as WorldCupPlayerStat & { matchIds: Set<string> });

          current.value += 1;
          current.matchIds.add(match.id);
          scorerMap.set(key, current);
        }
      }

      return [...scorerMap.values()]
        .map(({ matchIds, ...stat }) => ({ ...stat, matches: matchIds.size }))
        .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName, 'es'));
    });
  },

  async getAssists() {
    return [];
  },

  async getDiscipline() {
    return withCache('fifa:discipline', CACHE_TTL.stats, async () => {
      const matches = getFinishedMatchesWithTeams(await this.getMatches());
      if (matches.length === 0) return { players: [], teams: [] };

      const playerMap = new Map<string, WorldCupDisciplinePlayerStat>();
      const teamMap = new Map<string, WorldCupDisciplineTeamStat>();

      for (const { match, live } of await fetchLiveMatches(matches)) {
        const players = getLivePlayers(live);

        for (const booking of getLiveBookings(live)) {
          if (!booking.IdPlayer || (booking.Card !== 1 && booking.Card !== 2)) continue;
          const player = players.find((item) => item.IdPlayer === booking.IdPlayer);
          const team = getTeamFromLiveMatch(match, booking.IdTeam || player?.IdTeam);
          if (!team) continue;

          const playerKey = `${team.id}:${booking.IdPlayer}`;
          const playerStat =
            playerMap.get(playerKey) ||
            ({
              id: playerKey,
              playerName: getPlayerName(player, 'Jugador FIFA'),
              team,
              yellowCards: 0,
              redCards: 0,
              relatedMatches: [],
            } as WorldCupDisciplinePlayerStat);

          const teamStat =
            teamMap.get(team.id) ||
            ({
              team,
              yellowCards: 0,
              redCards: 0,
            } as WorldCupDisciplineTeamStat);

          if (booking.Card === 1) {
            playerStat.yellowCards += 1;
            teamStat.yellowCards += 1;
          }

          if (booking.Card === 2) {
            playerStat.redCards += 1;
            teamStat.redCards += 1;
          }

          if (!playerStat.relatedMatches.includes(match.id)) {
            playerStat.relatedMatches.push(match.id);
          }

          playerMap.set(playerKey, playerStat);
          teamMap.set(team.id, teamStat);
        }
      }

      return {
        players: [...playerMap.values()].sort(
          (a, b) =>
            b.redCards - a.redCards ||
            b.yellowCards - a.yellowCards ||
            a.playerName.localeCompare(b.playerName, 'es')
        ),
        teams: [...teamMap.values()].sort(
          (a, b) =>
            b.redCards - a.redCards ||
            b.yellowCards - a.yellowCards ||
            a.team.name.localeCompare(b.team.name, 'es')
        ),
      };
    });
  },

  async getTeamDetail(teamId: string) {
    return withCache(`fifa:team:${teamId}`, CACHE_TTL.teams, async () => {
      const payload = await fetchJson<FifaTeamPayload>(getTeamDetailUrl(teamId));
      const name = getText(payload.Name, payload.ShortClubName || payload.Abbreviation || 'Equipo FIFA');

      return {
        id: payload.IdTeam || teamId,
        name,
        shortName: getText(payload.ShortName, payload.ShortClubName || name),
        code: payload.Abbreviation || payload.IdCountry || '',
        confederation: payload.IdConfederation,
        countryCode: payload.IdCountry || payload.IdAssociation,
      } as WorldCupTeamDetail;
    });
  },
};
