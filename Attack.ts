import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import CombatResolver, {
  CombatResult,
} from '@civ-clone/core-unit/Rules/CombatResolver';
import Damaged from '@civ-clone/core-unit/Rules/Damaged';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import DefenderRank from '@civ-clone/core-unit/Rules/DefenderRank';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as rngInstance } from '@civ-clone/core-random';
import strength from '@civ-clone/core-unit/strength';

/**
 * A `CombatResolver` gave a result `Attack` can't apply: a bug in the ruleset, not something a player did.
 */
export class CombatResultError extends Error {}

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
    //  that defends. With `DefenderRank` rules, the best score defends instead.
    const candidates = this._unitRegistry
        .getByTile(this.to())
        .map((unit: Unit): [Unit, ReturnType<typeof strength>] => [
          unit,
          strength(this.unit(), unit, this.ruleRegistry()),
        ]),
      [[defender, [attack, defence]]] =
        this.ruleRegistry().get(DefenderRank).length === 0
          ? candidates.sort(
              ([, [, a]], [, [, b]]): number => b.value() - a.value()
            )
          : this.rankDefenders(candidates),
      power = Math.min(1, this.unit().moves().value()),
      result = this.ruleRegistry()
        .process(
          CombatResolver,
          this.unit(),
          defender,
          attack,
          defence,
          power,
          this._randomNumberGenerator
        )
        .find(
          (answer: CombatResult | undefined): boolean => answer !== undefined
        );

    if (result !== undefined) {
      this.resolve(result, defender, power);

      return;
    }

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

  /**
   * The candidates in the order the `DefenderRank` rules score them, highest first; equal scores keep the square's
   *  order. A unit's score is the first answer that isn't `undefined`, its defence if there is none, and `-Infinity`
   *  for `NaN`.
   */
  private rankDefenders(
    candidates: [Unit, ReturnType<typeof strength>][]
  ): [Unit, ReturnType<typeof strength>][] {
    return candidates
      .map(
        ([unit, [attack, defence]]: [Unit, ReturnType<typeof strength>]): [
          [Unit, ReturnType<typeof strength>],
          number
        ] => {
          const answer = this.ruleRegistry()
              .process(DefenderRank, this.unit(), unit, attack, defence)
              .find(
                (score: number | undefined): boolean => score !== undefined
              ),
            score = answer === undefined ? defence.value() : answer;

          return [
            [unit, [attack, defence]],
            Number.isNaN(score) ? -Infinity : score,
          ];
        }
      )
      .sort(([, a], [, b]): number => (a === b ? 0 : b > a ? 1 : -1))
      .map(
        ([candidate]: [[Unit, ReturnType<typeof strength>], number]): [
          Unit,
          ReturnType<typeof strength>
        ] => candidate
      );
  }

  /**
   * Applies a `CombatResolver`'s result: the winner keeps the damage it took, the loser is `Defeated`, an attacker that
   *  won spends `power` of its moves as after the single roll, and then `Damaged` is processed for a winner that took
   *  damage, before `Moved`. A result that doesn't name this battle's attacker and defender as winner and loser, or that
   *  leaves the winner with no hit points, is a bug in the ruleset: it throws `CombatResultError` and changes nothing.
   */
  private resolve(result: CombatResult, defender: Unit, power: number): void {
    const attacker = this.unit(),
      { winner, loser } = result;

    if (
      !(
        (winner === attacker && loser === defender) ||
        (winner === defender && loser === attacker)
      )
    ) {
      throw new CombatResultError(
        'A CombatResolver result must name the attacker and the defender as the winner and the loser, one each.'
      );
    }

    const damage =
        winner === attacker ? result.attackerDamage : result.defenderDamage,
      damaged = damage > 0,
      [, maximum] = winner.hitPoints();

    if (damaged && winner.damage() + damage >= maximum) {
      throw new CombatResultError(
        `A CombatResolver result must leave the winner alive: ${
          winner.damage() + damage
        } damage of ${maximum} hit points.`
      );
    }

    if (damaged) {
      winner.setDamage(winner.damage() + damage);
    }

    this.ruleRegistry().process(Defeated, loser, winner, this);

    if (winner === attacker) {
      attacker.moves().subtract(power, this.constructor.name);
    }

    if (damaged) {
      this.ruleRegistry().process(Damaged, winner, loser, this);
    }

    this.ruleRegistry().process(Moved, attacker, this);
  }
}

export default Attack;
