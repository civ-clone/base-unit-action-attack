import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * A `CombatResolver` gave a result `Attack` can't apply: a bug in the ruleset, not something a player did.
 */
export declare class CombatResultError extends Error {}
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
   *  order. A unit's score is the first answer that isn't `undefined`, its defence if there is none, and `-Infinity`
   *  for `NaN`.
   */
  private rankDefenders;
  /**
   * Applies a `CombatResolver`'s result: the winner keeps the damage it took, the loser is `Defeated`, an attacker that
   *  won spends `power` of its moves as after the single roll, and then `Damaged` is processed for a winner that took
   *  damage, before `Moved`. A result that doesn't name this battle's attacker and defender as winner and loser, or that
   *  leaves the winner with no hit points, is a bug in the ruleset: it throws `CombatResultError` and changes nothing.
   */
  private resolve;
}
export default Attack;
