import type {
  WorldCupDisciplineSummary,
  WorldCupPlayerStat,
  WorldCupRemoteMatch,
  WorldCupStandingGroup,
  WorldCupTeamDetail,
  WorldCupTeamSummary,
} from '../types/worldCupCenter';

export interface WorldCupDataProvider {
  getMatches(): Promise<WorldCupRemoteMatch[]>;
  getTeams(): Promise<WorldCupTeamSummary[]>;
  getStandings(): Promise<WorldCupStandingGroup[]>;
  getScorers(): Promise<WorldCupPlayerStat[]>;
  getAssists(): Promise<WorldCupPlayerStat[]>;
  getDiscipline(): Promise<WorldCupDisciplineSummary>;
  getTeamDetail?(teamId: string): Promise<WorldCupTeamDetail>;
}
