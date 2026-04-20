import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types.js";

// Matches Context
import { MatchRepository } from "../../contexts/matches/domain/match.repository.js";
import { PrismaMatchRepository } from "../../contexts/matches/infrastructure/prisma-match.repository.js";
import { SearchMatchesService } from "../../contexts/matches/application/search-matches.service.js";

// Draw Context
import { DrawRepository } from "../../contexts/draw/domain/draw.repository.js";
import { PrismaDrawRepository } from "../../contexts/draw/infrastructure/prisma-draw.repository.js";
import { CreateDrawService } from "../../contexts/draw/application/create-draw.service.js";
import { SearchCurrentDrawService } from "../../contexts/draw/application/search-current-draw.service.js";

const container = new Container();

// Matches Context Bindings
container.bind<MatchRepository>(TYPES.MatchRepository).to(PrismaMatchRepository);
container.bind<SearchMatchesService>(TYPES.SearchMatchesService).to(SearchMatchesService);

// Draw Context Bindings
container.bind<DrawRepository>(TYPES.DrawRepository).to(PrismaDrawRepository);
container.bind<CreateDrawService>(TYPES.CreateDrawService).to(CreateDrawService);
container.bind<SearchCurrentDrawService>(TYPES.SearchCurrentDrawService).to(SearchCurrentDrawService);

export { container };
