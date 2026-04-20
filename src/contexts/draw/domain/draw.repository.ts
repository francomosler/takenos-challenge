import { Draw } from './draw';
import { Team } from './team';

export interface DrawRepository {
  save(draw: Draw): Promise<void>;
  searchCurrent(): Promise<Draw | null>;
  findAllTeams(): Promise<Team[]>;
  deleteAll(): Promise<void>;
}
