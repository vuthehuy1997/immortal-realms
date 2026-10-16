#!/usr/bin/env python3
"""Select + optimise the CC0 Xianxia Pixel Pack (willYEE) for the game.

Usage: python3 -I tools/build_assets.py <path to Xianxia_Pixel_Pack> 
Outputs: public/assets/xp/** (palette-quantised PNGs) and src/data/manifest.generated.json
The source pack is NOT committed; only the selected, optimised subset is (see docs/ASSET_LICENSE_AUDIT.md).
"""
import json, os, shutil, sys
from PIL import Image

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'xp')
pack = json.load(open(os.path.join(SRC, 'pack.json')))
CH, SM = pack['characters'], pack['smooth_animations']

HEROES = ['swordsman', 'heroine', 'fanscholar', 'monk', 'saber', 'twinblade']
MOBS = ['wolf', 'snake', 'toad', 'treant', 'golem', 'skeleton', 'soldier', 'bat', 'thunderbird', 'peachspirit', 'paperdoll',
        'waterghost', 'ghost', 'foxfire', 'foxdemon', 'jiangshi', 'swordspirit',
        'ghost_v_violet', 'ghost_v_gold', 'ghost_v_crimson', 'foxfire_v_red', 'foxfire_v_green',
        'jiangshi_v_red', 'jiangshi_v_purple', 'swordspirit_v_gold', 'swordspirit_v_blood']
MOB_ANIMS = ['idle', 'move', 'attack', 'hurt', 'death']
BOSSES = {'fallenimmortal': ['idle', 'move', 'attack_a', 'attack_b', 'special', 'hurt', 'death'],
          'ninetail': ['idle', 'move', 'attack_a', 'attack_b', 'special', 'hurt', 'death'],
          'jiaolong': ['idle', 'move', 'attack_a', 'attack_b', 'special', 'hurt', 'death']}
NPC_HEROES = ['staffbeggar', 'spearman', 'archer']  # non-playable villagers: idle + walk only
HERO_SMOOTH = ['idle', 'walk', 'combo1', 'combo2', 'combo3']
HERO_SKILL = ['dash', 'cast', 'block', 'hurt', 'death']
PROPS = {  # key -> source file in backgrounds/
    'pavilion': 'bg_mid_01_00', 'stonebridge': 'bg_mid_01_01', 'bamboo': 'bg_mid_01_03', 'pine': 'bg_mid_01_04',
    'stairs': 'bg_mid_01_05', 'paifang': 'bg_mid_02_00', 'tower': 'bg_mid_02_01', 'moonwall': 'bg_mid_02_02',
    'corridor': 'bg_mid_02_03', 'taihurocks': 'bg_mid_02_04', 'willow': 'bg_mid_02_05',
    'lingzhi': 'bg_xianxia_deco_01_00', 'orchid': 'bg_xianxia_deco_01_01', 'rock': 'bg_xianxia_deco_01_02',
    'bambooshoot': 'bg_xianxia_deco_01_03', 'lotuspond': 'bg_xianxia_deco_01_04', 'petals': 'bg_xianxia_deco_01_05',
    'goldpaifang': 'bg_xianxia_mid_03_00', 'palace': 'bg_xianxia_mid_03_01', 'jadebridge': 'bg_xianxia_mid_03_02',
    'dragonpillar': 'bg_xianxia_mid_03_03', 'lotusthrone': 'bg_xianxia_mid_03_04', 'goldgate': 'bg_xianxia_mid_03_05',
    'floatisle': 'bg_xianxia_mid_04_00', 'lotusbowl': 'bg_xianxia_mid_04_01', 'array': 'bg_xianxia_mid_04_02',
    'standstone': 'bg_xianxia_mid_04_03', 'stonecircle': 'bg_xianxia_mid_04_04', 'peachtree': 'bg_xianxia_mid_04_06',
    'pagoda7': 'bg_xianxia_mid_04_07',
    # menu backdrop (pale far layer)
    'farpalace': 'bg_xianxia_far_03_00', 'farisle': 'bg_xianxia_far_03_02', 'fargalaxy': 'bg_xianxia_far_03_03',
    'fargate': 'bg_xianxia_far_04_00', 'farpagoda': 'bg_xianxia_far_04_01', 'farbuddha': 'bg_xianxia_far_04_05',
}
AMBIENT = ['xf_amb_firefly', 'xf_amb_mist_00', 'xf_amb_mist_01', 'xf_amb_peach', 'xf_amb_crane_flap_far', 'xf_amb_rain', 'xf_amb_willow', 'xf_amb_auspicious_00']

manifest = {'sheets': {}, 'props': {}, 'fx': {}, 'ui': {}, 'icons': {}, 'portraits': {}}
saved = {'src': 0, 'out': 0}


def optimise(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert('RGBA')
    q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    q.save(dst, optimize=True)
    saved['src'] += os.path.getsize(src); saved['out'] += os.path.getsize(dst)
    return im.size


def rel(p): return 'assets/xp/' + os.path.relpath(p, OUT).replace(os.sep, '/')


def add_sheet(key, src, frames, fps, loop, ox, oy):
    dst = os.path.join(OUT, 'sprites', key + '.png')
    w, h = optimise(src, dst)
    fw = w // frames
    manifest['sheets'][key] = {'url': rel(dst), 'fw': fw, 'fh': h, 'frames': frames, 'fps': fps, 'loop': loop, 'ox': round(ox / fw, 4), 'oy': round(oy / h, 4)}


for hero in HEROES + NPC_HEROES:
    for a in (HERO_SMOOTH if hero in HEROES else ['idle', 'walk']):
        k = f'xf_hero_{hero}_{a}'
        m = SM.get(k)
        if not m: print('missing smooth', k); continue
        add_sheet(f'hero.{hero}.{a}', os.path.join(SRC, 'characters/smooth', k + '.png'), m['frames'], m['fps'], m['loop'], m['body_x'], m['foot_y'])
    for a in (HERO_SKILL if hero in HEROES else []):
        k = f'xf_hero_{hero}_{a}'
        m = CH.get(k)
        if not m: print('missing', k); continue
        add_sheet(f'hero.{hero}.{a}', os.path.join(SRC, 'characters', k + '.png'), m['frames'], m['fps'], False, m['body_x'], m['foot_y'])

for mob in MOBS:
    for a in MOB_ANIMS:
        k = f'xf_mob_{mob}_{a}'
        m = CH.get(k)
        if not m: print('missing', k); continue
        add_sheet(f'mob.{mob}.{a}', os.path.join(SRC, 'characters', k + '.png'), m['frames'], m['fps'], m['loop'], m['cell'] / 2, m['cell_h'])
for boss, anims in BOSSES.items():
    for a in anims:
        k = f'xf_boss_{boss}_{a}'
        m = CH.get(k)
        if not m: print('missing', k); continue
        add_sheet(f'boss.{boss}.{a}', os.path.join(SRC, 'characters', k + '.png'), m['frames'], m['fps'], m['loop'], m['cell'] / 2, m['cell_h'])

for name, f in PROPS.items():
    dst = os.path.join(OUT, 'props', name + '.png')
    w, h = optimise(os.path.join(SRC, 'backgrounds', f + '.png'), dst)
    manifest['props'][name] = {'url': rel(dst), 'w': w, 'h': h}

FX_ANCHOR = {'center': (0.5, 0.5), 'bottom': (0.5, 1.0), 'left': (0.0, 0.5)}
for k, m in pack['fx'].items():
    if not (k.startswith('xf_') and not k.startswith('xf_amb')) and k not in AMBIENT:
        continue
    if k.startswith('xf_amb') and k not in AMBIENT:
        continue
    dst = os.path.join(OUT, 'fx', k + '.png')
    w, h = optimise(os.path.join(SRC, 'fx', k + '.png'), dst)
    anchor = m.get('anchor') or 'center'
    ox, oy = FX_ANCHOR.get(anchor, (0.5, 0.5))
    frames = m.get('frames', 1)  # ambient strips like mist/cloud are single tileable images
    manifest['fx'][k] = {'url': rel(dst), 'fw': w // frames, 'fh': h, 'frames': frames, 'ox': ox, 'oy': oy, 'anchor': anchor}

for f in sorted(os.listdir(os.path.join(SRC, 'ui'))):
    if f.endswith('.png'):
        dst = os.path.join(OUT, 'ui', f)
        w, h = optimise(os.path.join(SRC, 'ui', f), dst)
        manifest['ui'][f[:-4].replace('ui_xianxia_', '')] = {'url': rel(dst), 'w': w, 'h': h}
for f in sorted(os.listdir(os.path.join(SRC, 'icons'))):
    if f.endswith('.png'):
        dst = os.path.join(OUT, 'icons', f)
        optimise(os.path.join(SRC, 'icons', f), dst)
        manifest['icons'][f[:-4].replace('icon_xianxia_', '')] = {'url': rel(dst)}
for f in sorted(os.listdir(os.path.join(SRC, 'characters'))):
    if f.startswith('xf_npc_') and f.endswith('.png'):
        dst = os.path.join(OUT, 'portraits', f)
        w, h = optimise(os.path.join(SRC, 'characters', f), dst)
        manifest['portraits'][f[:-4].replace('xf_npc_', '')] = {'url': rel(dst), 'w': w, 'h': h}

shutil.copy(os.path.join(SRC, 'LICENSE.txt'), os.path.join(OUT, 'LICENSE.txt'))
with open(os.path.join(ROOT, 'src', 'data', 'manifest.generated.json'), 'w') as fh:
    json.dump(manifest, fh, indent=1, sort_keys=True)
print({k: len(v) for k, v in manifest.items()}, 'MB src->out: %.1f -> %.1f' % (saved['src'] / 1e6, saved['out'] / 1e6))
