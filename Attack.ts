import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

export class Attack extends Action {
  #unitRegistry: UnitRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    unitRegistry: UnitRegistry = unitRegistryInstance
  ) {
    super(from, to, unit, ruleRegistry);

    this.#unitRegistry = unitRegistry;
  }

  perform(): void {
    const [defender]: Unit[] = this.#unitRegistry
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
      this.ruleRegistry().process(Defeated, defender, this.unit(), this);

      this.unit().moves().subtract(power, this.constructor.name);

      return;
    }

    this.ruleRegistry().process(Defeated, this.unit(), defender, this);
  }
}

export default Attack;
