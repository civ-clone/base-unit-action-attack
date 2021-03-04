"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attack = void 0;
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Action_1 = require("@civ-clone/core-unit/Action");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
class Attack extends Action_1.default {
    perform() {
        const [defender] = UnitRegistry_1.instance
            .getByTile(this.to())
            .sort((a, b) => b.defence().value() - a.defence().value()), power = Math.min(1, this.unit().moves().value());
        if ((this.unit().attack().value() * power) * Math.random() >=
            defender.defence().value() * Math.random()) {
            this.ruleRegistry().process(Defeated_1.Defeated, defender, this.unit());
            this.unit().moves().subtract(power, this.constructor.name);
            return;
        }
        this.ruleRegistry().process(Defeated_1.Defeated, this.unit(), defender);
    }
}
exports.Attack = Attack;
exports.default = Attack;
//# sourceMappingURL=Attack.js.map