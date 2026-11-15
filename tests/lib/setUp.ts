import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import World from '@civ-clone/core-world/World';
import { Yield as YieldRule } from '@civ-clone/core-unit/Rules/Yield';
import { Attack as AttackYield, Defence } from '@civ-clone/core-unit/Yields';
import YieldValue from '@civ-clone/core-yield/Yield';

export type Event = [string, ...any[]];

/**
 * A scripted random number generator: hands out `values` in order and records each draw.
 */
export const scripted = (...values: number[]) => {
  const draws: number[] = [],
    rng = (): number => {
      if (draws.length >= values.length) {
        throw new Error('Drew more numbers than were scripted.');
      }

      const value = values[draws.length];

      draws.push(value);

      return value;
    };

  return { draws, rng };
};

/**
 * Two squares, a registry of each kind and a log of the `Defeated` and `Moved` rules processed, in order.
 */
export const setUp = () => {
  const ruleRegistry = new RuleRegistry(),
    unitRegistry = new UnitRegistry(),
    world = new World(new Generator(2, 1)),
    from = new Tile(0, 0, new Terrain(), world),
    to = new Tile(1, 0, new Terrain(), world),
    attackerPlayer = new Player(),
    defenderPlayer = new Player(),
    events: Event[] = [],
    strengths = new Map<Unit, [number, number]>(),
    unit = (
      tile: Tile,
      player: Player,
      attack: number,
      defence: number,
      moves: number = 1
    ): Unit => {
      const created = new Unit(null, player, tile, ruleRegistry);

      strengths.set(created, [attack, defence]);
      created.moves().set(moves);
      unitRegistry.register(created);

      return created;
    };

  ruleRegistry.register(
    new YieldRule(
      new Criterion((unit: Unit): boolean => strengths.has(unit)),
      new Effect((unit: Unit, unitYield: YieldValue): void => {
        const [attack, defence] = strengths.get(unit)!;

        if (unitYield instanceof AttackYield) {
          unitYield.set(attack);
        }

        if (unitYield instanceof Defence) {
          unitYield.set(defence);
        }
      })
    ),
    new Defeated(
      new Effect((loser: Unit, winner: Unit): void => {
        events.push(['defeated', loser, winner]);
      })
    ),
    new Moved(
      new Effect((moved: Unit): void => {
        events.push(['moved', moved, moved.moves().value()]);
      })
    )
  );

  return {
    attackerPlayer,
    defenderPlayer,
    events,
    from,
    ruleRegistry,
    to,
    unit,
    unitRegistry,
  };
};
