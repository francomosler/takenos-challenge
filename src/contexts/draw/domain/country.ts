import { ValueObject } from "../../../shared/domain/value-object";

export interface CountryProps {
  id: number;
  name: string;
}

export class Country extends ValueObject<CountryProps> {
  private constructor(id: number, name: string) {
    super({ id, name });
  }

  public static create(id: number, name: string): Country {
    return new Country(id, name);
  }

  public static fromPrimitives(primitives: CountryProps): Country {
    return new Country(primitives.id, primitives.name);
  }

  public toPrimitives(): CountryProps {
    return {
      id: this.props.id,
      name: this.props.name,
    };
  }

  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }
}
