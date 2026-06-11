import { worldCup2026Matches } from '../data/worldCup2026Fixture';
import type {
  WorldCupCountdown,
  WorldCupFilterMode,
  WorldCupGroupId,
  WorldCupMatch,
  WorldCupStageId,
  WorldCupTournamentState,
} from '../types/worldCup';

export const ARGENTINA_LOCALE = 'es-AR';
export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

type MatchDateGroup = {
  dateKey: string;
  label: string;
  matches: WorldCupMatch[];
};

type FixtureFilterInput = {
  mode: WorldCupFilterMode;
  group?: WorldCupGroupId | 'all';
  searchTerm?: string;
  now?: Date;
};

type FixtureValidationResult = {
  isValid: boolean;
  errors: string[];
};

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

const TIME_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const LAST_MATCH_VISIBLE_WINDOW_MS = 4 * 60 * 60 * 1000;

const getMatchTime = (match: WorldCupMatch) => new Date(match.kickoffUtc).getTime();

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const getAllWorldCupMatches = () => [...worldCup2026Matches];

export const getUpcomingMatches = (now = new Date()) => {
  const nowTime = now.getTime();
  return worldCup2026Matches.filter((match) => getMatchTime(match) > nowTime);
};

export const getNextWorldCupMatch = (now = new Date()) => getUpcomingMatches(now)[0] ?? null;

export const getArgentinaMatches = () =>
  worldCup2026Matches.filter((match) => isArgentinaMatch(match));

export const getMatchesByStage = (stage: WorldCupStageId) =>
  worldCup2026Matches.filter((match) => match.stage === stage);

export const getMatchesByGroup = (group: WorldCupGroupId) =>
  worldCup2026Matches.filter((match) => match.group === group);

export const getArgentinaDateKey = (date: Date) => {
  const parts = DATE_KEY_FORMATTER.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const getMatchDateKeyForArgentina = (match: WorldCupMatch) =>
  getArgentinaDateKey(new Date(match.kickoffUtc));

export const formatMatchDateForArgentina = (match: WorldCupMatch) =>
  SHORT_DATE_FORMATTER.format(new Date(match.kickoffUtc));

export const formatMatchDateHeadingForArgentina = (match: WorldCupMatch) =>
  DATE_LABEL_FORMATTER.format(new Date(match.kickoffUtc));

export const formatMatchTimeForArgentina = (match: WorldCupMatch) =>
  `${TIME_FORMATTER.format(new Date(match.kickoffUtc))} ARG`;

export const getCountdownToMatch = (
  match: WorldCupMatch | null,
  now = new Date()
): WorldCupCountdown => {
  if (!match) {
    return { hasStarted: true, days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const diff = getMatchTime(match) - now.getTime();
  if (diff <= 0) {
    return { hasStarted: true, days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  return {
    hasStarted: false,
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
};

export const getTournamentState = (now = new Date()): WorldCupTournamentState => {
  const firstMatch = worldCup2026Matches[0];
  const finalMatch = worldCup2026Matches[worldCup2026Matches.length - 1];
  const nowTime = now.getTime();

  if (nowTime < getMatchTime(firstMatch)) {
    return { status: 'before', currentStageLabel: 'Cuenta regresiva' };
  }

  if (nowTime > getMatchTime(finalMatch) + LAST_MATCH_VISIBLE_WINDOW_MS) {
    return { status: 'finished', currentStageLabel: 'Mundial finalizado' };
  }

  const nextMatch = getNextWorldCupMatch(now);
  return {
    status: 'in-progress',
    currentStageLabel: nextMatch?.stageLabel ?? finalMatch.stageLabel,
  };
};

export const isArgentinaMatch = (match: WorldCupMatch) =>
  match.home.code === 'ARG' || match.away.code === 'ARG';

export const isKnockoutMatch = (match: WorldCupMatch) => match.stage !== 'group';

export const isTodayMatch = (match: WorldCupMatch, now = new Date()) =>
  getMatchDateKeyForArgentina(match) === getArgentinaDateKey(now);

export const getMatchDisplayName = (match: WorldCupMatch) =>
  `${match.home.name} vs ${match.away.name}`;

export const getMatchSearchText = (match: WorldCupMatch) =>
  normalizeText(
    [
      match.matchNumber,
      match.home.name,
      match.home.code,
      match.away.name,
      match.away.code,
      match.city,
      match.stadium,
      match.stageLabel,
      match.groupLabel,
    ]
      .filter(Boolean)
      .join(' ')
  );

export const filterWorldCupMatches = ({
  mode,
  group = 'all',
  searchTerm = '',
  now = new Date(),
}: FixtureFilterInput) => {
  const nowTime = now.getTime();
  const normalizedSearch = normalizeText(searchTerm);

  return worldCup2026Matches.filter((match) => {
    if (mode === 'today' && !isTodayMatch(match, now)) return false;
    if (mode === 'upcoming' && getMatchTime(match) <= nowTime) return false;
    if (mode === 'argentina' && !isArgentinaMatch(match)) return false;
    if (mode === 'group' && match.stage !== 'group') return false;
    if (mode === 'knockout' && !isKnockoutMatch(match)) return false;
    if (mode === 'group' && group !== 'all' && match.group !== group) return false;
    if (normalizedSearch && !getMatchSearchText(match).includes(normalizedSearch)) return false;
    return true;
  });
};

export const groupMatchesByArgentinaDate = (matches: WorldCupMatch[]): MatchDateGroup[] => {
  const groups = new Map<string, MatchDateGroup>();

  for (const match of matches) {
    const dateKey = getMatchDateKeyForArgentina(match);
    const current = groups.get(dateKey);

    if (current) {
      current.matches.push(match);
    } else {
      groups.set(dateKey, {
        dateKey,
        label: formatMatchDateHeadingForArgentina(match),
        matches: [match],
      });
    }
  }

  return [...groups.values()];
};

export const getTodayMatches = (now = new Date()) =>
  worldCup2026Matches.filter((match) => isTodayMatch(match, now));

export const validateWorldCupFixtureDataset = (): FixtureValidationResult => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const numbers = new Set<number>();
  let previousKickoff = 0;

  if (worldCup2026Matches.length !== 104) {
    errors.push(`Expected 104 matches, found ${worldCup2026Matches.length}.`);
  }

  for (const match of worldCup2026Matches) {
    if (ids.has(match.id)) errors.push(`Duplicate match id: ${match.id}.`);
    ids.add(match.id);

    if (numbers.has(match.matchNumber)) {
      errors.push(`Duplicate match number: ${match.matchNumber}.`);
    }
    numbers.add(match.matchNumber);

    const kickoff = Date.parse(match.kickoffUtc);
    if (!Number.isFinite(kickoff) || !match.kickoffUtc.endsWith('Z')) {
      errors.push(`Invalid UTC kickoff for match ${match.matchNumber}.`);
    }

    if (kickoff < previousKickoff) {
      errors.push(`Fixture is not chronological at match ${match.matchNumber}.`);
    }
    previousKickoff = kickoff;

    if (match.stage === 'group' && !match.group) {
      errors.push(`Missing group for match ${match.matchNumber}.`);
    }

    if (match.stage !== 'group' && match.group) {
      errors.push(`Unexpected group on knockout match ${match.matchNumber}.`);
    }

    if (match.status !== 'finished' && (match.homeScore !== undefined || match.awayScore !== undefined)) {
      errors.push(`Non-finished match ${match.matchNumber} contains a score.`);
    }
  }

  if (getArgentinaMatches().length < 3) {
    errors.push('Argentina filter did not find the expected group-stage matches.');
  }

  return { isValid: errors.length === 0, errors };
};
