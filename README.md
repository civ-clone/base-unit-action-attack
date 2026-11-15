# base-unit-action-attack

This package provides the `Attack` `Action` for `Unit`s.

An attack is fought by the unit on the attacked square that defends best against the attacker: the highest defence
after core-unit's `Strength` rules, the first of equals. It is a single roll, `attack × power × random ≥ defence ×
random` with the attacker's draw first, where `power` is the attacker's moves left up to 1. The loser is `Defeated`
(and destroyed by the game's rules); a winning attacker spends `power` of its moves.

Two optional core-unit rules change that, and a game that registers neither fights exactly as above:

- `DefenderRank` scores each unit on the square; the highest score defends (the first of equals), and a unit no rule
  answers for scores its defence.
- `CombatResolver` decides the battle. The winner keeps the damage the result gives it (`unit.setDamage`), and
  `Damaged` is processed for it if it took any, after `Defeated` for the loser.
