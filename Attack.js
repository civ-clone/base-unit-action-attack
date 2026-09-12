"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attack = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Action_1 = require("@civ-clone/core-unit/Action");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const core_random_1 = require("@civ-clone/core-random");
class Attack extends Action_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, randomNumberGenerator = core_random_1.instance) {
        super(from, to, unit, ruleRegistry);
        this._unitRegistry = unitRegistry;
        this._randomNumberGenerator = randomNumberGenerator;
    }
    perform() {
        const [defender] = this._unitRegistry
            .getByTile(this.to())
            .sort((a, b) => b.defence().value() - a.defence().value()), power = Math.min(1, this.unit().moves().value());
        if (this.unit().attack().value() * power * this._randomNumberGenerator() >=
            defender.defence().value() * this._randomNumberGenerator()) {
            this.ruleRegistry().process(Defeated_1.default, defender, this.unit(), this);
            this.unit().moves().subtract(power, this.constructor.name);
            this.ruleRegistry().process(Moved_1.default, this.unit(), this);
            return;
        }
        this.ruleRegistry().process(Defeated_1.default, this.unit(), defender, this);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
}
exports.Attack = Attack;
exports.default = Attack;
//# sourceMappingURL=Attack.js.map