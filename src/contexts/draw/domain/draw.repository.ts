import { Draw } from './draw';
import { Team } from './team';

export interface DrawRepository {
  save(draw: Draw): Promise<void>;
  searchCurrent(): Promise<Draw | null>;
  findAllTeams(): Promise<Team[]>;
  // Soft-archives the currently active draw (if any). History rows remain
  // in the database for auditing / analytics; only the uniqueness slot is
  // released so a new draw can be created.
  archiveCurrent(): Promise<void>;
}
