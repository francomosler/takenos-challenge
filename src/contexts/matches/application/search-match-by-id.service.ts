import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import { MatchRepository } from "../domain/match.repository.js";
import { MatchNotFoundError } from "../domain/exceptions/match-not-found.error.js";
import { MatchPrimitives } from "../domain/match.entity.js";

@injectable()
export class SearchMatchByIdService {
  constructor(
    @inject(TYPES.MatchRepository)
    private readonly matchRepository: MatchRepository
  ) {}

  async run(id: number): Promise<MatchPrimitives> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Match id must be a positive integer");
    }

    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundError(id);
    }

    return match.toPrimitives();
  }
}
