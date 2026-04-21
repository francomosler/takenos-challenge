export const TYPES = {
  // Matches Context
  MatchRepository: Symbol.for("MatchRepository"),
  SearchMatchesService: Symbol.for("SearchMatchesService"),
  SearchMatchByIdService: Symbol.for("SearchMatchByIdService"),

  // Teams Context
  TeamRepository: Symbol.for("TeamRepository"),
  SearchTeamsService: Symbol.for("SearchTeamsService"),
  SearchTeamByIdService: Symbol.for("SearchTeamByIdService"),

  // Draw Context
  DrawRepository: Symbol.for("DrawRepository"),
  CreateDrawService: Symbol.for("CreateDrawService"),
  SearchCurrentDrawService: Symbol.for("SearchCurrentDrawService"),
  SearchDrawStatisticsService: Symbol.for("SearchDrawStatisticsService"),

  // Infrastructure
  PrismaClient: Symbol.for("PrismaClient"),
};
