# Combat Design — current build
Real-time, top-down, mouse-aimed. Formulas are pure code in `src/core` (unit-tested); tunables are in `src/data` and exported in `design/catalog/skills-combat.md`.

- **Damage:** `computeDamage(attacker, target, mult, rng)` = max(1, round((atk × mult − def × 0.5) × crit)); seeded RNG. Ambush on an unaware enemy ×1.5.
- **Player kit:** 3-hit sword combo (LMB/Space; hit 3 is the heavy finisher, windup/recover/lunge/knockback per hit), Shift dash (62 units, 0.3s invulnerable, 1.1s cooldown), techniques 1–4 unlocked by level: Flying Sword (projectile, pierce), Crescent Moon Slash (wave), Lotus Burst (stun burst), Ten Thousand Swords (ground rain). Mana + cooldowns.
- **Spirit roots:** flame (atk, crit, burn), tide (mana, slow), verdant (HP/def, lifesteal).
- **Enemies:** rushers (windup telegraph before melee), casters (keep distance, volleys), chargers (telegraphed dash). Stats = base × HP_BASE 4 × zone tier; elites ×2.8 HP / ×1.4 ATK / ×3 XP with an affix.
- **Bosses:** each damaging move (slam, sweep, charge, rain, teleport, summon, ring) has a visible windup of ≥ 85% nominal time; phases at 66% / 33%, enrage in phase 3; windup and gaps vary per fight; no autosave while engaged.
- **Recovery:** HP regen 1.2%/s after 6s without combat (5%/s on a spirit array after 2s); death costs max(5, 10%) stones.
- **Feel:** hit flash, knockback, damage numbers, screen shake, SFX per action. Real-GPU frame pacing is **unmeasured**.
