export type WorldCupStageId =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'third-place'
  | 'final';

export type WorldCupGroupId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L';

export type WorldCupMatchStatus = 'scheduled' | 'live' | 'finished';

export type WorldCupTeam = {
  code: string;
  name: string;
  shortName: string;
  emojiFlag?: string;
  isPlaceholder?: boolean;
};

export type WorldCupMatch = {
  id: string;
  matchNumber: number;
  kickoffUtc: string;
  stage: WorldCupStageId;
  stageLabel: string;
  group?: WorldCupGroupId;
  groupLabel?: string;
  home: WorldCupTeam;
  away: WorldCupTeam;
  city: string;
  stadium: string;
  status: WorldCupMatchStatus;
  homeScore?: number;
  awayScore?: number;
};

export type WorldCupFixtureMetadata = {
  sourceName: string;
  sourceUrl: string;
  endpointUrl: string;
  lastVerifiedAt: string;
  timezonePolicy: string;
};

export type WorldCupCountdown = {
  hasStarted: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
};

export type WorldCupTournamentState = {
  status: 'before' | 'in-progress' | 'finished';
  currentStageLabel: string;
};

export type WorldCupFilterMode =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'argentina'
  | 'group'
  | 'knockout';
