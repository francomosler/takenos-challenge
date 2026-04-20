export class DrawAlreadyExistsError extends Error {
  constructor() {
    super('A draw already exists');
    this.name = 'DrawAlreadyExistsError';
  }
}
