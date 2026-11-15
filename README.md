# base-unit-action-attack

This package provides the `Attack` `Action` for `Unit`s.

An attack is fought by the unit on the attacked square that defends best against the attacker: the highest defence
after core-unit's `Strength` rules, the first of equals. It is a single roll, `attack × power × random ≥ defence ×
random` with the attacker's draw first, where `power` is the attacker's moves left up to 1. The loser is `Defeated`
(and destroyed by the game's rules); a winning attacker spends `power` of its moves.

Two optional core-unit rules change that, and a game that registers neither fights exactly as above:

- `DefenderRank` scores each unit on the square; the highest score defends (the first of equals), and a unit no rule
  answers for scores its defence.
- `CombatResolver` decides the battle. The winner keeps the damage the result gives it (`unit.setDamage`), the loser is
  `Defeated`, a winning attacker spends `power`, and then `Damaged` is processed for a winner that took damage, before
  `Moved`. A result must name the attacker and the defender as winner and loser and leave the winner alive (damage
  below its `HitPoints`); otherwise `perform` throws `CombatResultError` and changes nothing.

Each rule's first answer that isn't `undefined` is used (a `NaN` score ranks last). A rule declines through its
criteria; every matching rule still runs, so only one resolver should match a battle.
