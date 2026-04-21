export class MatchNotFoundError extends Error {
  constructor(id: number) {
    super(`Match with id ${id} not found`);
    this.name = "MatchNotFoundError";
  }
}
