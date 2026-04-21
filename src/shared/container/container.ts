import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types.js";

// Matches Context
import { MatchRepository } from "../../contexts/matches/domain/match.repository.js";
import { PrismaMatchRepository } from "../../contexts/matches/infrastructure/prisma-match.repository.js";
import { SearchMatchesService } from "../../contexts/matches/application/search-matches.service.js";
import { SearchMatchByIdService } from "../../contexts/matches/application/search-match-by-id.service.js";

// Teams Context
import { TeamRepository } from "../../contexts/teams/domain/team.repository.js";
import { PrismaTeamRepository } from "../../contexts/teams/infrastructure/prisma-team.repository.js";
import { SearchTeamsService } from "../../contexts/teams/application/search-teams.service.js";
import { SearchTeamByIdService } from "../../contexts/teams/application/search-team-by-id.service.js";

// Draw Context
import { DrawRepository } from "../../contexts/draw/domain/draw.repository.js";
import { PrismaDrawRepository } from "../../contexts/draw/infrastructure/prisma-draw.repository.js";
import { CreateDrawService } from "../../contexts/draw/application/create-draw.service.js";
import { SearchCurrentDrawService } from "../../contexts/draw/application/search-current-draw.service.js";
import { SearchDrawStatisticsService } from "../../contexts/draw/application/search-draw-statistics.service.js";

const container = new Container();

// Matches Context Bindings
container.bind<MatchRepository>(TYPES.MatchRepository).to(PrismaMatchRepository);
container.bind<SearchMatchesService>(TYPES.SearchMatchesService).to(SearchMatchesService);
container.bind<SearchMatchByIdService>(TYPES.SearchMatchByIdService).to(SearchMatchByIdService);

// Teams Context Bindings
container.bind<TeamRepository>(TYPES.TeamRepository).to(PrismaTeamRepository);
container.bind<SearchTeamsService>(TYPES.SearchTeamsService).to(SearchTeamsService);
container.bind<SearchTeamByIdService>(TYPES.SearchTeamByIdService).to(SearchTeamByIdService);

// Draw Context Bindings
container.bind<DrawRepository>(TYPES.DrawRepository).to(PrismaDrawRepository);
container.bind<CreateDrawService>(TYPES.CreateDrawService).to(CreateDrawService);
container.bind<SearchCurrentDrawService>(TYPES.SearchCurrentDrawService).to(SearchCurrentDrawService);
container.bind<SearchDrawStatisticsService>(TYPES.SearchDrawStatisticsService).to(SearchDrawStatisticsService);

export { container };
