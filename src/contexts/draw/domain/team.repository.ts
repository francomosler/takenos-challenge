import { Team } from './team';

export interface TeamRepository {
  findAll(): Promise<Team[]>;
}
