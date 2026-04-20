import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import { Draw } from '../domain/draw.js';
import { DrawRepository } from '../domain/draw.repository.js';

@injectable()
export class SearchCurrentDrawService {
  constructor(
    @inject(TYPES.DrawRepository) private readonly drawRepository: DrawRepository
  ) {}

  public async run(): Promise<Draw | null> {
    return this.drawRepository.searchCurrent();
  }
}
