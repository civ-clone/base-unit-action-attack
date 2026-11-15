"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attack = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Action_1 = require("@civ-clone/core-unit/Action");
const CombatResolver_1 = require("@civ-clone/core-unit/Rules/CombatResolver");
const Damaged_1 = require("@civ-clone/core-unit/Rules/Damaged");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const DefenderRank_1 = require("@civ-clone/core-unit/Rules/DefenderRank");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const core_random_1 = require("@civ-clone/core-random");
const strength_1 = require("@civ-clone/core-unit/strength");
class Attack extends Action_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, randomNumberGenerator = core_random_1.instance) {
        super(from, to, unit, ruleRegistry);
        this._unitRegistry = unitRegistry;
        this._randomNumberGenerator = randomNumberGenerator;
    }
    perform() {
        // Each unit on the tile at the strength it would defend at against this attacker, strongest first: that's the one
        //  that defends. With `DefenderRank` rules, the best score defends instead.
        const candidates = this._unitRegistry
            .getByTile(this.to())
            .map((unit) => [
            unit,
            (0, strength_1.default)(this.unit(), unit, this.ruleRegistry()),
        ]), [[defender, [attack, defence]]] = this.ruleRegistry().get(DefenderRank_1.default).length === 0
            ? candidates.sort(([, [, a]], [, [, b]]) => b.value() - a.value())
            : this.rankDefenders(candidates), power = Math.min(1, this.unit().moves().value()), [result] = this.ruleRegistry().process(CombatResolver_1.default, this.unit(), defender, attack, defence, power, this._randomNumberGenerator);
        if (result !== undefined) {
            this.resolve(result, power);
            return;
        }
        if (attack.value() * power * this._randomNumberGenerator() >=
            defence.value() * this._randomNumberGenerator()) {
            this.ruleRegistry().process(Defeated_1.default, defender, this.unit(), this);
            this.unit().moves().subtract(power, this.constructor.name);
            this.ruleRegistry().process(Moved_1.default, this.unit(), this);
            return;
        }
        this.ruleRegistry().process(Defeated_1.default, this.unit(), defender, this);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
    /**
     * The candidates in the order the `DefenderRank` rules score them, highest first; equal scores keep the square's
     *  order. A unit no rule answers for scores its defence.
     */
    rankDefenders(candidates) {
        return candidates
            .map(([unit, [attack, defence]]) => {
            const [score = defence.value()] = this.ruleRegistry().process(DefenderRank_1.default, this.unit(), unit, attack, defence);
            return [[unit, [attack, defence]], score];
        })
            .sort(([, a], [, b]) => b - a)
            .map(([candidate]) => candidate);
    }
    /**
     * Applies a `CombatResolver`'s result: the winner keeps the damage it took (`Damaged`, if it took any), the loser is
     *  `Defeated`, and an attacker that won spends `power` of its moves, as after the single roll.
     */
    resolve(result, power) {
        const attacker = this.unit(), { winner, loser } = result, damage = winner === attacker ? result.attackerDamage : result.defenderDamage;
        if (damage > 0) {
            winner.setDamage(winner.damage() + damage);
        }
        this.ruleRegistry().process(Defeated_1.default, loser, winner, this);
        if (damage > 0) {
            this.ruleRegistry().process(Damaged_1.default, winner, loser, this);
        }
        if (winner === attacker) {
            attacker.moves().subtract(power, this.constructor.name);
        }
        this.ruleRegistry().process(Moved_1.default, attacker, this);
    }
}
exports.Attack = Attack;
Attack.transient = ['_randomNumberGenerator', '_unitRegistry'];
exports.default = Attack;
//# sourceMappingURL=Attack.js.map