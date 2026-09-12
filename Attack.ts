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
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as rngInstance } from '@civ-clone/core-random';

export class Attack extends Action {
  private _randomNumberGenerator: () => number;
  private _unitRegistry: UnitRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    unitRegistry: UnitRegistry = unitRegistryInstance,
    randomNumberGenerator: () => number = rngInstance
  ) {
    super(from, to, unit, ruleRegistry);

    this._unitRegistry = unitRegistry;
    this._randomNumberGenerator = randomNumberGenerator;
  }

  perform(): void {
    const [defender]: Unit[] = this._unitRegistry
        .getByTile(this.to())
        .sort(
          (a: Unit, b: Unit): number =>
            b.defence().value() - a.defence().value()
        ),
      power = Math.min(1, this.unit().moves().value());

    if (
      this.unit().attack().value() * power * this._randomNumberGenerator() >=
      defender.defence().value() * this._randomNumberGenerator()
    ) {
      this.ruleRegistry().process(Defeated, defender, this.unit(), this);

      this.unit().moves().subtract(power, this.constructor.name);

      this.ruleRegistry().process(Moved, this.unit(), this);

      return;
    }

    this.ruleRegistry().process(Defeated, this.unit(), defender, this);

    this.ruleRegistry().process(Moved, this.unit(), this);
  }
}

export default Attack;
