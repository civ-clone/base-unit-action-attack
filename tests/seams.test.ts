import CombatResolver, {
  CombatResult,
} from '@civ-clone/core-unit/Rules/CombatResolver';
import { scripted, setUp } from './lib/setUp';
import Attack, { CombatResultError } from '../Attack';
import Criterion from '@civ-clone/core-rule/Criterion';
import Damaged from '@civ-clone/core-unit/Rules/Damaged';
import DefenderRank from '@civ-clone/core-unit/Rules/DefenderRank';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';
import {
  Attack as AttackYield,
  Defence,
  HitPoints,
} from '@civ-clone/core-unit/Yields';
import { Yield as YieldRule } from '@civ-clone/core-unit/Rules/Yield';
import YieldValue from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';

describe('Attack seams', (): void => {
  describe('with none registered', (): void => {
    it('should leave both units undamaged and process no `Damaged`', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = setUp(),
        attacker = unit(from, attackerPlayer, 2, 1),
        defender = unit(to, defenderPlayer, 1, 1);

      ruleRegistry.register(
        new Damaged(
          new Effect((damaged: Unit): void => {
            events.push(['damaged', damaged]);
          })
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted(0.9, 0.1).rng
      ).perform();

      expect(events.map(([name]) => name)).to.deep.equal(['defeated', 'moved']);
      expect(Object.keys(attacker)).not.to.include('_damage');
      expect(Object.keys(defender)).not.to.include('_damage');
    });

    it('should ignore a `DefenderRank` rule that is switched off', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = setUp(),
        attacker = unit(from, attackerPlayer, 1, 1),
        strong = unit(to, defenderPlayer, 1, 2),
        weak = unit(to, defenderPlayer, 1, 1),
        rank = new DefenderRank(
          new Effect((attacker: Unit, candidate: Unit): number =>
            candidate === weak ? 10 : 0
          )
        );

      ruleRegistry.register(rank);
      rank.disable();

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted(0.9, 0.1).rng
      ).perform();

      expect(events[0]).to.deep.equal(['defeated', strong, attacker]);
    });
  });

  describe('DefenderRank', (): void => {
    it('should be defended by the highest score, the first of equals', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = setUp(),
        attacker = unit(from, attackerPlayer, 1, 1),
        seen: [Unit, Unit, number, number][] = [];

      unit(to, defenderPlayer, 1, 4);

      const first = unit(to, defenderPlayer, 1, 1);

      unit(to, defenderPlayer, 1, 3);

      const second = unit(to, defenderPlayer, 1, 1);

      // Defence × hit points left, say: the two weak units are whole, the strong ones nearly dead.
      ruleRegistry.register(
        new DefenderRank(
          new Effect(
            (
              attacker: Unit,
              candidate: Unit,
              attack: AttackYield,
              defence: Defence
            ): number => {
              seen.push([attacker, candidate, attack.value(), defence.value()]);

              return defence.value() * (defence.value() > 1 ? 0.1 : 1);
            }
          )
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted(0.9, 0.1).rng
      ).perform();

      expect(events[0]).to.deep.equal(['defeated', first, attacker]);
      expect(
        seen.map(([attacker, , attack, defence]) => [attacker, attack, defence])
      ).to.deep.equal([
        [attacker, 1, 4],
        [attacker, 1, 1],
        [attacker, 1, 3],
        [attacker, 1, 1],
      ]);
      expect(second.destroyed()).to.false;
    });

    it('should take the first score that is not undefined, and rank a NaN score last', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = setUp(),
        attacker = unit(from, attackerPlayer, 1, 1),
        broken = unit(to, defenderPlayer, 1, 9),
        low = unit(to, defenderPlayer, 1, 1),
        high = unit(to, defenderPlayer, 1, 2);

      ruleRegistry.register(
        new DefenderRank(
          new Effect((): number => undefined as unknown as number)
        ),
        new DefenderRank(
          new Effect(
            (
              attacker: Unit,
              candidate: Unit,
              attack: AttackYield,
              defence: Defence
            ): number => (candidate === broken ? NaN : -defence.value())
          )
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted(0.9, 0.1).rng
      ).perform();

      // Scores: NaN (as -Infinity), -1, -2.
      expect(events[0]).to.deep.equal(['defeated', low, attacker]);
      expect(high.destroyed()).to.false;
    });

    it('should score a unit no rule answers for by its defence', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = setUp(),
        attacker = unit(from, attackerPlayer, 1, 1),
        plain = unit(to, defenderPlayer, 1, 3),
        ranked = unit(to, defenderPlayer, 1, 5);

      ruleRegistry.register(
        new DefenderRank(
          new Criterion(
            (attacker: Unit, candidate: Unit): boolean => candidate === ranked
          ),
          new Effect((): number => 2)
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted(0.9, 0.1).rng
      ).perform();

      expect(events[0]).to.deep.equal(['defeated', plain, attacker]);
    });
  });

  describe('CombatResolver', (): void => {
    // Every unit has `maximum` hit points.
    const hitPoints = (maximum: number) =>
      new YieldRule(
        new Criterion(
          (unit: Unit, unitYield: YieldValue): boolean =>
            unitYield instanceof HitPoints
        ),
        new Effect((unit: Unit, unitYield: YieldValue): void =>
          unitYield.set(maximum)
        )
      );

    const withResolver = (
      resolve: (
        attacker: Unit,
        defender: Unit,
        attack: AttackYield,
        defence: Defence,
        power: number,
        rng: () => number
      ) => CombatResult
    ) => {
      const context = setUp(),
        { events, ruleRegistry } = context;

      ruleRegistry.register(
        new CombatResolver(new Effect(resolve)),
        new Damaged(
          new Effect((damaged: Unit, by: Unit, action: Attack): void => {
            events.push([
              'damaged',
              damaged,
              by,
              damaged.damage(),
              action.unit().moves().value(),
            ]);
          })
        ),
        hitPoints(10)
      );

      return context;
    };

    it('should be asked with the pair, their strengths, the power and the generator', (): void => {
      const asked: any[] = [],
        { rng } = scripted(0.3),
        {
          attackerPlayer,
          defenderPlayer,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = withResolver(
          (attacker, defender, attack, defence, power, generator) => {
            asked.push([
              attacker,
              defender,
              attack.value(),
              defence.value(),
              power,
              generator(),
            ]);

            return {
              winner: attacker,
              loser: defender,
              attackerDamage: 0,
              defenderDamage: 10,
            };
          }
        ),
        attacker = unit(from, attackerPlayer, 3, 1, 0.5),
        defender = unit(to, defenderPlayer, 1, 2);

      new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

      expect(asked).to.deep.equal([[attacker, defender, 3, 2, 0.5, 0.3]]);
    });

    it('should keep a winning attacker’s damage, defeat the defender and spend the power', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = withResolver((attacker, defender) => ({
          winner: attacker,
          loser: defender,
          attackerDamage: 4,
          defenderDamage: 10,
        })),
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1);

      attacker.setDamage(1);

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(attacker.damage()).to.equal(5);
      expect(Object.keys(defender)).not.to.include('_damage');
      expect(events).to.deep.equal([
        ['defeated', defender, attacker],
        // After the attacker has spent its power.
        ['damaged', attacker, defender, 5, 0],
        ['moved', attacker, 0],
      ]);
    });

    it('should keep a winning defender’s damage and defeat the attacker, which keeps its moves', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = withResolver((attacker, defender) => ({
          winner: defender,
          loser: attacker,
          attackerDamage: 10,
          defenderDamage: 3,
        })),
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1);

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(defender.damage()).to.equal(3);
      expect(events).to.deep.equal([
        ['defeated', attacker, defender],
        ['damaged', defender, attacker, 3, 1],
        ['moved', attacker, 1],
      ]);
    });

    it('should process no `Damaged` for a winner that took none', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = withResolver((attacker, defender) => ({
          winner: attacker,
          loser: defender,
          attackerDamage: 0,
          defenderDamage: 10,
        })),
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1);

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(Object.keys(attacker)).not.to.include('_damage');
      expect(events).to.deep.equal([
        ['defeated', defender, attacker],
        ['moved', attacker, 0],
      ]);
    });

    it('should fall back to the single roll when no resolver answers', (): void => {
      const context = setUp(),
        {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = context,
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1),
        { draws, rng } = scripted(0.2, 0.8);

      ruleRegistry.register(
        new CombatResolver(
          new Criterion((): boolean => false),
          new Effect((attacker: Unit, defender: Unit) => ({
            winner: attacker,
            loser: defender,
            attackerDamage: 0,
            defenderDamage: 0,
          }))
        )
      );

      new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

      expect(draws).to.deep.equal([0.2, 0.8]);
      expect(events[0]).to.deep.equal(['defeated', attacker, defender]);
    });

    it('should use the first result that is not undefined', (): void => {
      const context = setUp(),
        {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = context,
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1),
        ran: string[] = [];

      // One that matches but answers nothing, then one that answers.
      ruleRegistry.register(
        hitPoints(10),
        new CombatResolver(
          new Effect((): CombatResult => {
            ran.push('silent');

            return undefined as unknown as CombatResult;
          })
        ),
        new CombatResolver(
          new Effect((attacker: Unit, defender: Unit): CombatResult => {
            ran.push('answers');

            return {
              winner: defender,
              loser: attacker,
              attackerDamage: 10,
              defenderDamage: 2,
            };
          })
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(ran).to.deep.equal(['silent', 'answers']);
      expect(defender.damage()).to.equal(2);
      expect(events[0]).to.deep.equal(['defeated', attacker, defender]);
    });

    it('should use the first of two answers, though both resolvers run', (): void => {
      const context = setUp(),
        {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = context,
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1),
        ran: string[] = [];

      ruleRegistry.register(
        hitPoints(10),
        new CombatResolver(
          new Effect((attacker: Unit, defender: Unit): CombatResult => {
            ran.push('first');

            return {
              winner: attacker,
              loser: defender,
              attackerDamage: 1,
              defenderDamage: 10,
            };
          })
        ),
        new CombatResolver(
          new Effect((attacker: Unit, defender: Unit): CombatResult => {
            ran.push('second');

            return {
              winner: defender,
              loser: attacker,
              attackerDamage: 10,
              defenderDamage: 1,
            };
          })
        )
      );

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(ran).to.deep.equal(['first', 'second']);
      expect(attacker.damage()).to.equal(1);
      expect(events[0]).to.deep.equal(['defeated', defender, attacker]);
    });

    it('should refuse a result that does not name the attacker and the defender, one each', (): void => {
      const outsider = { id: 'outsider' } as unknown as Unit;

      (
        [
          (attacker: Unit, defender: Unit) => [attacker, attacker],
          (attacker: Unit, defender: Unit) => [defender, defender],
          (attacker: Unit, defender: Unit) => [outsider, defender],
          (attacker: Unit, defender: Unit) => [attacker, outsider],
        ] as ((attacker: Unit, defender: Unit) => [Unit, Unit])[]
      ).forEach((pick): void => {
        const {
            attackerPlayer,
            defenderPlayer,
            events,
            from,
            ruleRegistry,
            to,
            unit,
            unitRegistry,
          } = withResolver((attacker, defender) => {
            const [winner, loser] = pick(attacker, defender);

            return { winner, loser, attackerDamage: 1, defenderDamage: 1 };
          }),
          attacker = unit(from, attackerPlayer, 1, 1),
          defender = unit(to, defenderPlayer, 1, 1);

        expect((): void =>
          new Attack(
            from,
            to,
            attacker,
            ruleRegistry,
            unitRegistry,
            scripted().rng
          ).perform()
        ).to.throw(CombatResultError);
        expect(events).to.deep.equal([]);
        expect(attacker.damage()).to.equal(0);
        expect(defender.damage()).to.equal(0);
        expect(attacker.moves().value()).to.equal(1);
      });
    });

    it('should refuse a result that leaves the winner with no hit points', (): void => {
      const {
          attackerPlayer,
          defenderPlayer,
          events,
          from,
          ruleRegistry,
          to,
          unit,
          unitRegistry,
        } = withResolver((attacker, defender) => ({
          winner: attacker,
          loser: defender,
          attackerDamage: 6,
          defenderDamage: 10,
        })),
        attacker = unit(from, attackerPlayer, 1, 1),
        defender = unit(to, defenderPlayer, 1, 1);

      // 4 + 6 reaches the 10 hit points.
      attacker.setDamage(4);

      expect((): void =>
        new Attack(
          from,
          to,
          attacker,
          ruleRegistry,
          unitRegistry,
          scripted().rng
        ).perform()
      ).to.throw(CombatResultError, 'alive');
      expect(events).to.deep.equal([]);
      expect(attacker.damage()).to.equal(4);
      expect(defender.destroyed()).to.false;

      // 3 + 6 leaves 1.
      attacker.setDamage(3);

      new Attack(
        from,
        to,
        attacker,
        ruleRegistry,
        unitRegistry,
        scripted().rng
      ).perform();

      expect(attacker.damage()).to.equal(9);
    });
  });
});
