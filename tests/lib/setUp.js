"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUp = exports.scripted = void 0;
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Generator_1 = require("@civ-clone/core-world-generator/Generator");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const Player_1 = require("@civ-clone/core-player/Player");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Terrain_1 = require("@civ-clone/core-terrain/Terrain");
const Tile_1 = require("@civ-clone/core-world/Tile");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const World_1 = require("@civ-clone/core-world/World");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const Yields_1 = require("@civ-clone/core-unit/Yields");
/**
 * A scripted random number generator: hands out `values` in order and records each draw.
 */
const scripted = (...values) => {
    const draws = [], rng = () => {
        if (draws.length >= values.length) {
            throw new Error('Drew more numbers than were scripted.');
        }
        const value = values[draws.length];
        draws.push(value);
        return value;
    };
    return { draws, rng };
};
exports.scripted = scripted;
/**
 * Two squares, a registry of each kind and a log of the `Defeated` and `Moved` rules processed, in order.
 */
const setUp = () => {
    const ruleRegistry = new RuleRegistry_1.default(), unitRegistry = new UnitRegistry_1.default(), world = new World_1.default(new Generator_1.default(2, 1)), from = new Tile_1.default(0, 0, new Terrain_1.default(), world), to = new Tile_1.default(1, 0, new Terrain_1.default(), world), attackerPlayer = new Player_1.default(), defenderPlayer = new Player_1.default(), events = [], strengths = new Map(), unit = (tile, player, attack, defence, moves = 1) => {
        const created = new Unit_1.default(null, player, tile, ruleRegistry);
        strengths.set(created, [attack, defence]);
        created.moves().set(moves);
        unitRegistry.register(created);
        return created;
    };
    ruleRegistry.register(new Yield_1.Yield(new Criterion_1.default((unit) => strengths.has(unit)), new Effect_1.default((unit, unitYield) => {
        const [attack, defence] = strengths.get(unit);
        if (unitYield instanceof Yields_1.Attack) {
            unitYield.set(attack);
        }
        if (unitYield instanceof Yields_1.Defence) {
            unitYield.set(defence);
        }
    })), new Defeated_1.default(new Effect_1.default((loser, winner) => {
        events.push(['defeated', loser, winner]);
    })), new Moved_1.default(new Effect_1.default((moved) => {
        events.push(['moved', moved, moved.moves().value()]);
    })));
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
exports.setUp = setUp;
//# sourceMappingURL=setUp.js.map