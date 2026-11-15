import { scripted, setUp } from './lib/setUp';
import Attack from '../Attack';
import Effect from '@civ-clone/core-rule/Effect';
import Strength from '@civ-clone/core-unit/Rules/Strength';
import Unit from '@civ-clone/core-unit/Unit';
import { Attack as AttackYield, Defence } from '@civ-clone/core-unit/Yields';
import { expect } from 'chai';

// What an attack does with none of the optional rules registered: the single roll it has always made.
describe('Attack', (): void => {
  it('should win when attack × power × the first draw is at least defence × the second', (): void => {
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
      defender = unit(to, defenderPlayer, 1, 2),
      { draws, rng } = scripted(0.5, 0.5);

    // 2 × 1 × 0.5 = 1 ≥ 2 × 0.5 = 1: a tie goes to the attacker.
    new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

    expect(draws).to.deep.equal([0.5, 0.5]);
    expect(events).to.deep.equal([
      ['defeated', defender, attacker],
      ['moved', attacker, 0],
    ]);
  });

  it('should lose when attack × power × the first draw is below defence × the second', (): void => {
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
      defender = unit(to, defenderPlayer, 1, 2),
      { draws, rng } = scripted(0.5, 0.6);

    new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

    expect(draws).to.deep.equal([0.5, 0.6]);
    // A losing attacker keeps its moves; `Defeated` destroys it.
    expect(events).to.deep.equal([
      ['defeated', attacker, defender],
      ['moved', attacker, 1],
    ]);
  });

  it('should draw for the attacker first', (): void => {
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
      defender = unit(to, defenderPlayer, 1, 1),
      { rng } = scripted(0.9, 0.1);

    new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

    expect(events[0]).to.deep.equal(['defeated', defender, attacker]);
  });

  it('should scale the attack by the moves left, up to 1, and spend that much on a win', (): void => {
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
      attacker = unit(from, attackerPlayer, 4, 1, 1 / 3),
      defender = unit(to, defenderPlayer, 1, 1),
      { rng } = scripted(0.75, 0.9);

    // 4 × ⅓ × 0.75 = 1 ≥ 1 × 0.9.
    new Attack(from, to, attacker, ruleRegistry, unitRegistry, rng).perform();

    expect(events).to.deep.equal([
      ['defeated', defender, attacker],
      ['moved', attacker, 0],
    ]);

    const second = setUp(),
      fresh = second.unit(second.from, second.attackerPlayer, 4, 1, 3);

    second.unit(second.to, second.defenderPlayer, 1, 1);

    new Attack(
      second.from,
      second.to,
      fresh,
      second.ruleRegistry,
      second.unitRegistry,
      scripted(0.5, 0.5).rng
    ).perform();

    // Power is at most 1, so a unit with 3 moves spends 1.
    expect(second.events[1]).to.deep.equal(['moved', fresh, 2]);
  });

  it('should be defended by the strongest defender, the first of equals', (): void => {
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
      attacker = unit(from, attackerPlayer, 1, 1);

    unit(to, defenderPlayer, 1, 1);

    const first = unit(to, defenderPlayer, 1, 3);

    unit(to, defenderPlayer, 1, 2);
    unit(to, defenderPlayer, 1, 3);

    new Attack(
      from,
      to,
      attacker,
      ruleRegistry,
      unitRegistry,
      scripted(0.9, 0.1).rng
    ).perform();

    expect(events[0]).to.deep.equal(['defeated', first, attacker]);
  });

  it('should fight at the strengths the `Strength` rules give the pair', (): void => {
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
      weak = unit(to, defenderPlayer, 1, 1),
      strong = unit(to, defenderPlayer, 1, 2);

    // The weaker unit is fortified ×4 against this attacker, so it defends, and the attacker loses.
    ruleRegistry.register(
      new Strength(
        new Effect(
          (
            from: Unit,
            against: Unit,
            attack: AttackYield,
            defence: Defence
          ): void => {
            if (against === weak) {
              defence.set(4);
            }
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
      scripted(0.9, 0.5).rng
    ).perform();

    expect(events[0]).to.deep.equal(['defeated', attacker, weak]);
    expect(strong.destroyed()).to.false;
  });
});
