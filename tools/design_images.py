"""Renders design/images from design/_image_jobs.json (written by tools/export_design.mjs)."""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'design', 'images')
M = json.load(open(os.path.join(ROOT, 'src/data/manifest.generated.json')))
JOBS = json.load(open(os.path.join(ROOT, 'design/_image_jobs.json')))
PUB = os.path.join(ROOT, 'public')

def load(url): return Image.open(os.path.join(PUB, url)).convert('RGBA')
def fit(im, size, up=True):
    k = min(size / im.width, size / im.height)
    if k > 1 and not up: k = 1
    if k > 1: k = max(1, int(k))  # integer upscale keeps pixel art crisp
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.NEAREST if k >= 1 else Image.LANCZOS)
def save(im, rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)
def first_frame(key, table='sheets', frame=0):
    s = M[table][key]; im = load(s['url']); fw, fh = s['fw'], s['fh']
    f = frame if isinstance(frame, int) else s['frames'] // 2
    return im.crop((f * fw, 0, (f + 1) * fw, fh))
def trim(im):
    b = im.getbbox(); return im.crop(b) if b else im
FONT = ImageFont.load_default()

def contact(keys, group, cell=96, cols=12):
    tiles = []
    for k in keys:
        try:
            if group == 'sheets': im = trim(first_frame(k))
            elif group == 'fx': im = trim(first_frame(k, 'fx', 'mid'))
            else: im = trim(load(M[group][k]['url']))
        except Exception: continue
        tiles.append((k, fit(im, cell - 8, up=group != 'portraits')))
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * (cell + 12)), (30, 28, 40, 255)); d = ImageDraw.Draw(sheet)
    for i, (k, im) in enumerate(tiles):
        x, y = (i % cols) * cell, (i // cols) * (cell + 12)
        sheet.alpha_composite(im, (x + (cell - im.width) // 2, y + (cell - im.height) // 2))
        d.text((x + 2, y + cell - 2), k.replace('xf_', '').replace('ui_xianxia_', '')[:cell // 6], fill=(200, 200, 215, 255), font=FONT)
    return sheet

COL = {'grass': (92, 140, 70), 'grassDark': (64, 108, 62), 'moss': (88, 128, 90), 'path': (170, 140, 96), 'stone': (150, 152, 160), 'water': (60, 110, 190), 'sand': (214, 196, 140)}
ZCOL = [(255, 255, 255)]
def worldmap(j):
    w, h, S = j['width'], j['height'], 10
    im = Image.new('RGB', (w * S, h * S)); d = ImageDraw.Draw(im)
    for ty in range(h):
        for tx in range(w):
            i = ty * w + tx; c = COL.get(j['ground'][i], (0, 0, 0))
            d.rectangle([tx * S, ty * S, tx * S + S - 1, ty * S + S - 1], fill=c)
            if j['blocked'][i] and j['ground'][i] != 'water': d.rectangle([tx * S + 3, ty * S + 3, tx * S + 6, ty * S + 6], fill=tuple(int(v * 0.55) for v in c))
    colors = {'z': (255, 240, 120), 'b': (255, 70, 70), 'n': (120, 230, 255)}
    for m in j['marks']:
        x, y = m['x'] / 16 * S, m['y'] / 16 * S; c = colors[m['c']]
        d.ellipse([x - 6, y - 6, x + 6, y + 6], outline=c, width=2)
        d.text((x + 9, y - 5), m['label'], fill=(0, 0, 0), font=FONT, stroke_width=2, stroke_fill=(0, 0, 0)); d.text((x + 9, y - 5), m['label'], fill=c, font=FONT)
    return im

for j in JOBS:
    k = j['kind']
    if k == 'sheet': im = fit(trim(first_frame(j['key'])), 192)
    elif k == 'fx': im = fit(trim(first_frame(j['key'], 'fx', j.get('frame', 0))), 96)
    elif k == 'ui': im = fit(load(M['ui'][j['key']]['url']), 64)
    elif k == 'icon': im = fit(load(M['icons'][j['key']]['url']), 64)
    elif k == 'portrait': im = load(M['portraits'][j['key']]['url'])
    elif k == 'prop': im = fit(trim(load(M['props'][j['key']]['url'])), 160, up=False)
    elif k == 'worldmap': im = worldmap(j)
    elif k == 'contact': im = contact(j['keys'], j['group'], cell=128 if j['group'] in ('portraits', 'sheets') else 96, cols=10 if j['group'] in ('portraits', 'sheets') else 12)
    else: continue
    save(im, j['out'])
print(f'images: {len(JOBS)} rendered into design/images')
