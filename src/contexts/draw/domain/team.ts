import { ValueObject } from "../../../shared/domain/value-object";
import { Country, CountryProps } from "./country";

interface TeamProps {
  id: number;
  name: string;
  country: Country;
}

export interface TeamPrimitives {
  id: number;
  name: string;
  country: CountryProps;
}

export class Team extends ValueObject<TeamProps> {
  private constructor(id: number, name: string, country: Country) {
    super({ id, name, country });
  }

  public static create(
    id: number,
    name: string,
    country: Country
  ): Team {
    return new Team(id, name, country);
  }

  public static fromPrimitives(primitives: TeamPrimitives): Team {
    const country = Country.fromPrimitives(
      primitives.country
    );
    return new Team(primitives.id, primitives.name, country);
  }

  public toPrimitives(): TeamPrimitives {
    return {
      id: this.props.id,
      name: this.props.name,
      country: this.props.country.toPrimitives(),
    };
  }

  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get country(): Country {
    return this.props.country;
  }
}
