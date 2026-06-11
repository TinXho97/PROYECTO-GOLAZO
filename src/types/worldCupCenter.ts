import type { WorldCupGroupId, WorldCupMatchStatus, WorldCupStageId } from './worldCup';

export type WorldCupCenterSection =
  | 'matches'
  | 'standings'
  | 'scorers'
  | 'assists'
  | 'discipline'
  | 'teams';

export type WorldCupDataSource = 'fifa' | 'local';

export type WorldCupRemoteTeam = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  group?: WorldCupGroupId;
  groupLabel?: string;
  countryCode?: string;
  isPlaceholder?: boolean;
};

export type WorldCupRemoteMatch = {
  id: string;
  idStage: string;
  matchNumber: number;
  kickoffUtc: string;
  stage: WorldCupStageId;
  stageLabel: string;
  group?: WorldCupGroupId;
  groupLabel?: string;
  home: WorldCupRemoteTeam | null;
  away: WorldCupRemoteTeam | null;
  homeScore?: number;
  awayScore?: number;
  status: WorldCupMatchStatus;
  city: string;
  stadium: string;
};

export type WorldCupStandingTeam = {
  position: number;
  team: WorldCupRemoteTeam;
  group: WorldCupGroupId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isDirectQualification: boolean;
  isThirdPlace: boolean;
};

export type WorldCupStandingGroup = {
  group: WorldCupGroupId;
  label: string;
  hasStarted: boolean;
  teams: WorldCupStandingTeam[];
};

export type WorldCupThirdPlaceStanding = WorldCupStandingTeam & {
  thirdPlacePosition: number;
  qualificationLabel: 'Clasificacion provisional' | 'Fuera de clasificacion provisional';
};

export type WorldCupPlayerStat = {
  id: string;
  playerName: string;
  team: WorldCupRemoteTeam;
  value: number;
  matches?: number;
  minutes?: number;
};

export type WorldCupDisciplinePlayerStat = {
  id: string;
  playerName: string;
  team: WorldCupRemoteTeam;
  yellowCards: number;
  redCards: number;
  doubleYellowCards?: number;
  relatedMatches: string[];
};

export type WorldCupDisciplineTeamStat = {
  team: WorldCupRemoteTeam;
  yellowCards: number;
  redCards: number;
};

export type WorldCupDisciplineSummary = {
  players: WorldCupDisciplinePlayerStat[];
  teams: WorldCupDisciplineTeamStat[];
};

export type WorldCupTeamMatchSummary = {
  id: string;
  opponent: string;
  kickoffUtc: string;
  stageLabel: string;
  venue: string;
};

export type WorldCupTeamSummary = {
  team: WorldCupRemoteTeam;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  nextMatches: WorldCupTeamMatchSummary[];
};

export type WorldCupTeamDetail = {
  id: string;
  name: string;
  shortName: string;
  code: string;
  confederation?: string;
  countryCode?: string;
};
