import { AggregateRoot } from "../../../shared/domain/aggregate-root";

export interface TeamEntityPrimitives {
  id: number;
  name: string;
  country: {
    id: number;
    name: string;
  };
}

export class TeamEntity extends AggregateRoot {
  private constructor(
    readonly id: number,
    readonly name: string,
    readonly country: { id: number; name: string }
  ) {
    super();
  }

  public static create(
    id: number,
    name: string,
    country: { id: number; name: string }
  ): TeamEntity {
    return new TeamEntity(id, name, country);
  }

  public static fromPrimitives(
    primitives: TeamEntityPrimitives
  ): TeamEntity {
    return new TeamEntity(primitives.id, primitives.name, primitives.country);
  }

  public toPrimitives(): TeamEntityPrimitives {
    return {
      id: this.id,
      name: this.name,
      country: this.country,
    };
  }
}
