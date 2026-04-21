export class TeamNotFoundError extends Error {
  constructor(id: number) {
    super(`Team with id ${id} not found`);
    this.name = "TeamNotFoundError";
  }
}
