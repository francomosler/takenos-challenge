export const TYPES = {
  // Matches Context
  MatchRepository: Symbol.for("MatchRepository"),
  SearchMatchesService: Symbol.for("SearchMatchesService"),

  // Draw Context
  DrawRepository: Symbol.for("DrawRepository"),
  CreateDrawService: Symbol.for("CreateDrawService"),
  SearchCurrentDrawService: Symbol.for("SearchCurrentDrawService"),

  // Infrastructure
  PrismaClient: Symbol.for("PrismaClient"),
};
