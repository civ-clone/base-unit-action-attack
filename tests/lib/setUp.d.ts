import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
export type Event = [string, ...any[]];
/**
 * A scripted random number generator: hands out `values` in order and records each draw.
 */
export declare const scripted: (...values: number[]) => {
  draws: number[];
  rng: () => number;
};
/**
 * Two squares, a registry of each kind and a log of the `Defeated` and `Moved` rules processed, in order.
 */
export declare const setUp: () => {
  attackerPlayer: Player;
  defenderPlayer: Player;
  events: Event[];
  from: Tile;
  ruleRegistry: RuleRegistry;
  to: Tile;
  unit: (
    tile: Tile,
    player: Player,
    attack: number,
    defence: number,
    moves?: number
  ) => Unit;
  unitRegistry: UnitRegistry;
};
