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
  /**
   * The candidates in the order the `DefenderRank` rules score them, highest first; equal scores keep the square's
   *  order. A unit no rule answers for scores its defence.
   */
  private rankDefenders;
  /**
   * Applies a `CombatResolver`'s result: the winner keeps the damage it took (`Damaged`, if it took any), the loser is
   *  `Defeated`, and an attacker that won spends `power` of its moves, as after the single roll.
   */
  private resolve;
}
export default Attack;
