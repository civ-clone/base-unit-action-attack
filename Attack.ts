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
import strength from '@civ-clone/core-unit/strength';

export class Attack extends Action {
  static readonly transient = ['_randomNumberGenerator', '_unitRegistry'];
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
    // Each unit on the tile at the strength it would defend at against this attacker, strongest first: that's the one
    //  that defends.
    const [[defender, [attack, defence]]] = this._unitRegistry
        .getByTile(this.to())
        .map((unit: Unit): [Unit, ReturnType<typeof strength>] => [
          unit,
          strength(this.unit(), unit, this.ruleRegistry()),
        ])
        .sort(([, [, a]], [, [, b]]): number => b.value() - a.value()),
      power = Math.min(1, this.unit().moves().value());

    if (
      attack.value() * power * this._randomNumberGenerator() >=
      defence.value() * this._randomNumberGenerator()
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
