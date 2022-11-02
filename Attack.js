"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Attack_randomNumberGenerator, _Attack_unitRegistry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attack = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Action_1 = require("@civ-clone/core-unit/Action");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
class Attack extends Action_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, randomNumberGenerator = () => Math.random()) {
        super(from, to, unit, ruleRegistry);
        _Attack_randomNumberGenerator.set(this, void 0);
        _Attack_unitRegistry.set(this, void 0);
        __classPrivateFieldSet(this, _Attack_unitRegistry, unitRegistry, "f");
        __classPrivateFieldSet(this, _Attack_randomNumberGenerator, randomNumberGenerator, "f");
    }
    perform() {
        const [defender] = __classPrivateFieldGet(this, _Attack_unitRegistry, "f")
            .getByTile(this.to())
            .sort((a, b) => b.defence().value() - a.defence().value()), power = Math.min(1, this.unit().moves().value());
        if (this.unit().attack().value() * power * __classPrivateFieldGet(this, _Attack_randomNumberGenerator, "f").call(this) >=
            defender.defence().value() * __classPrivateFieldGet(this, _Attack_randomNumberGenerator, "f").call(this)) {
            this.ruleRegistry().process(Defeated_1.default, defender, this.unit(), this);
            this.unit().moves().subtract(power, this.constructor.name);
            return;
        }
        this.ruleRegistry().process(Defeated_1.default, this.unit(), defender, this);
    }
}
exports.Attack = Attack;
_Attack_randomNumberGenerator = new WeakMap(), _Attack_unitRegistry = new WeakMap();
exports.default = Attack;
//# sourceMappingURL=Attack.js.map