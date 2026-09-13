import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare class Attack extends Action {
  static readonly transient: string[];
  private _randomNumberGenerator;
  private _unitRegistry;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry?: RuleRegistry,
    unitRegistry?: UnitRegistry,
    randomNumberGenerator?: () => number
  );
  perform(): void;
}
export default Attack;
