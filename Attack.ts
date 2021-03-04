import {
  Defeated,
  IDefeatedRegistry,
} from '@civ-clone/core-unit/Rules/Defeated';
import Action from '@civ-clone/core-unit/Action';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as unitRegistryInstance } from '@civ-clone/core-unit/UnitRegistry';

export class Attack extends Action {
  perform(): void {
    const [defender]: Unit[] = unitRegistryInstance
        .getByTile(this.to())
        .sort(
          (a: Unit, b: Unit): number =>
            b.defence().value() - a.defence().value()
        ),
      power = Math.min(1, this.unit().moves().value());

    if (
      this.unit().attack().value() * power * Math.random() >=
      defender.defence().value() * Math.random()
    ) {
      (this.ruleRegistry() as IDefeatedRegistry).process(
        Defeated,
        defender,
        this.unit()
      );

      this.unit().moves().subtract(power, this.constructor.name);

      return;
    }

    (this.ruleRegistry() as IDefeatedRegistry).process(
      Defeated,
      this.unit(),
      defender
    );
  }
}

export default Attack;
