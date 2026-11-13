"""Original procedural visual studies, not production assets or image-service outputs.
Optional authoring tool: Python 3 + Pillow. No game/runtime dependency.
Run from the game root: python tools/make_visual_studies.py
"""
from pathlib import Path
import hashlib
import io
import json
import math
import random
from PIL import Image, ImageDraw, __version__ as PILLOW_VERSION

OUTPUT = Path(__file__).resolve().parents[1] / 'docs' / 'concepts'
STYLES = [
    dict(id='a', title='Sunlit storybook coast', size=(320, 180), seed=14,
         sand='#efd69b', wet='#c7ba85', water='#287e9a', shallow='#61c7bf', foam='#d8f3d9',
         forest='#4c874c', dark='#244e3f', mid='#3d8050', light='#8bb959', trunk='#aa7849',
         skin='#e8b084', shirt='#db7259', ui='#fff0cb', ink='#57432d'),
    dict(id='b', title='Lush adventure diorama', size=(480, 270), seed=29,
         sand='#d7b77c', wet='#a7a47b', water='#164b67', shallow='#388d92', foam='#abd6bc',
         forest='#254d3c', dark='#122d2b', mid='#347650', light='#739b51', trunk='#886246',
         skin='#dba177', shirt='#d3b876', ui='#132d2c', ink='#e5d7ad'),
    dict(id='c', title='Graphic island folklore', size=(320, 180), seed=57,
         sand='#edb37d', wet='#cf8c68', water='#245d71', shallow='#58ae9c', foam='#f4d5a1',
         forest='#315e54', dark='#213d40', mid='#477e63', light='#9ebc76', trunk='#a26956',
         skin='#e8ad86', shirt='#b95354', ui='#293c45', ink='#f5d8a6'),
]


def render(style):
    w, h = style['size']
    rng = random.Random(style['seed'])
    image = Image.new('RGB', (w, h), style['sand'])
    d = ImageDraw.Draw(image)
    dense = style['id'] == 'b'
    graphic = style['id'] == 'c'
    shore = [int(h * (.68 + .055 * math.sin(x / (w * .13)) + .018 * math.cos(x / 13))) for x in range(w)]
    # Irregular shore bands: land, wet sand, foam, shallow and deep water.
    for x, y in enumerate(shore):
        d.line((x, y, x, h), fill=style['water'])
        d.line((x, y, x, min(h, y + int(h * .08))), fill=style['shallow'])
        d.line((x, y - 3, x, y), fill=style['wet'])
        if x % 17 < 13:
            d.line((x, y + 3, x, y + 4), fill=style['foam'])
    for _ in range(110 if dense else 45):
        x, y = rng.randrange(w), rng.randrange(h)
        if y > shore[x] + 12:
            d.line((x, y, min(w - 1, x + rng.randrange(3, 11)), y), fill=style['shallow'])
    # Dark woodland with a clear meandering sandy entrance in the upper centre.
    d.polygon([(0, 0), (w, 0), (w, int(h * .29)), (int(w * .70), int(h * .27)),
               (int(w * .55), int(h * .34)), (int(w * .48), int(h * .19)),
               (int(w * .37), int(h * .23)), (int(w * .27), int(h * .39)), (0, int(h * .48))], fill=style['forest'])
    if graphic:
        for y in range(29, int(h * .42), 11):
            for x in range(3, int(w * .23), 13):
                d.polygon([(x, y), (x + 4, y - 3), (x + 8, y), (x + 4, y + 3)], outline=style['mid'])
    # Quiet sand clusters, shells and small vegetation: detail, not full-screen noise.
    for _ in range(220 if dense else 65):
        x, y = rng.randrange(w), rng.randrange(int(h * .30), int(h * .73))
        if y < shore[x] - 8:
            if rng.random() < .12:
                d.arc((x, y, x + 3, y + 2), 180, 355, fill=style['foam'])
            else:
                d.line((x, y, x + (2 if dense else 1), y), fill=style['wet'])

    def palm(x, y, scale: float = 1.0):
        r = int((19 if dense else 14) * scale)
        top = y - int(r * .7)
        d.ellipse((x - r, y - 2, x + r + 5, y + 7), fill=style['wet'])
        d.polygon([(x - 2, y), (x + 3, y), (x + 2, top - 1), (x - 1, top - 2)], fill=style['trunk'])
        for ty in range(top, y, 4):
            d.line((x - 1, ty, x + 2, ty - 1), fill=style['dark'])
        # Broad geometric leaves for C; clustered curved fronds for A/B.
        for a in [-2.9, -2.25, -1.5, -.75, -.1, .65, 1.7]:
            ex = int(x + math.cos(a) * r)
            ey = int(top + math.sin(a) * r * .64)
            mx, my = int((x + ex) / 2), int((top + ey) / 2) - (2 if graphic else 3)
            d.polygon([(x, top), (mx - 3, my - 3), (ex, ey), (mx + 2, my + 3)], fill=style['dark'])
            d.polygon([(x, top - 1), (mx - 2, my - 3), (ex - 1, ey - 1), (mx + 1, my)], fill=style['mid'])
            d.line((x, top - 2, mx, my - 2), fill=style['light'], width=1)
            if dense:
                for t in [.35, .55, .75]:
                    bx, by = int(x + (ex - x) * t), int(top + (ey - top) * t - 2)
                    d.line((bx - 3, by - 2, bx + 2, by + 2), fill=style['light'])
        d.rectangle((x, top, x + 2, top + 2), fill=style['trunk'])

    # Different canopy density/composition, not merely palette-swapped scenes.
    points = [(int(w * f), int(h * g), s) for f, g, s in [
        (.06, .31, 1.2), (.15, .26, 1.0), (.26, .24, 1.0), (.05, .48, 1.1),
        (.75, .22, 1.1), (.87, .24, 1.2), (.95, .36, 1.0)]]
    if dense:
        points += [(int(w * f), int(h * g), s) for f, g, s in [
            (.20, .40, 1.25), (.31, .19, 1), (.65, .20, 1.2), (.82, .35, 1), (.97, .19, 1.3)]]
    if graphic:
        points = points[::2] + [(int(w * .72), int(h * .43), 1.5)]
    for x, y, scale in sorted(points, key=lambda point: point[1]):
        palm(x, y, scale)
    # Shore rocks with clear material planes; folklore uses angular silhouettes.
    for fx, fy in [(.14, .61), (.72, .61), (.78, .66)]:
        x, y = int(w * fx), int(h * fy)
        r = 8 if dense else 6
        d.ellipse((x - r, y - 1, x + r + 3, y + 5), fill=style['wet'])
        d.polygon([(x - r, y), (x - r + 2, y - 7), (x + 2, y - 9), (x + r, y - 4), (x + r, y + 1)], fill=style['dark'])
        d.polygon([(x - r + 2, y - 6), (x + 2, y - 8), (x + r - 1, y - 4), (x, y - 2)], fill=style['mid'])
        d.line((x - r + 2, y - 6, x + 1, y - 8), fill=style['foam'])
    # A small wreck remnant is a concept prop, not a promised new gameplay feature.
    x, y = int(w * .84), int(h * .73)
    d.polygon([(x - 12, y - 6), (x + 13, y - 2), (x + 8, y + 11), (x - 7, y + 8)], fill=style['dark'])
    for n in range(4):
        d.line((x - 10 + n * 6, y - 4, x - 7 + n * 5, y + 7), fill=style['trunk'], width=2)
    # Distinct player silhouettes: medium, taller explorer, compact graphic castaway.
    px, py = int(w * .48), int(h * .51)
    height = 27 if dense else (14 if graphic else 19)
    body_w = 10 if dense else (11 if graphic else 9)
    d.ellipse((px - 7, py - 2, px + 9, py + 4), fill=style['wet'])
    d.rectangle((px - 4, py - 5, px - 1, py + 1), fill=style['dark'])
    d.rectangle((px + 2, py - 5, px + 5, py + 1), fill=style['dark'])
    d.rectangle((px - body_w // 2, py - height + 9, px + body_w // 2, py - 4), fill=style['shirt'])
    d.rectangle((px - 4, py - height + 2, px + 4, py - height + 9), fill=style['skin'])
    if graphic:
        d.polygon([(px - 7, py - height + 3), (px - 3, py - height - 2), (px + 4, py - height - 1), (px + 7, py - height + 3)], fill=style['shirt'])
    else:
        d.rectangle((px - 6, py - height + 1, px + 6, py - height + 3), fill=style['dark'])
        d.rectangle((px - 4, py - height - 2, px + 4, py - height + 1), fill=style['trunk'])
    d.point((px - 2, py - height + 6), fill=style['dark'])
    d.point((px + 2, py - height + 6), fill=style['dark'])
    if dense:
        d.line((px - 3, py - 15, px + 4, py - 6), fill=style['trunk'], width=2)
        d.rectangle((px + 4, py - 17, px + 8, py - 7), fill=style['dark'])
    # An identifiable axe sketch and style-specific UI framing.
    ax, ay = int(w * .59), int(h * .53)
    d.line((ax, ay, ax + 4, ay - 9), fill=style['trunk'], width=2)
    d.polygon([(ax + 2, ay - 8), (ax + 6, ay - 10), (ax + 9, ay - 6), (ax + 3, ay - 5)], fill=style['foam'])
    if style['id'] == 'a':
        d.rounded_rectangle((8, 8, 93, 22), radius=3, fill=style['ui'])
        d.text((13, 11), 'THE COAST', fill=style['ink'])
    elif dense:
        d.rectangle((12, 10, 155, 29), fill=style['ui'])
        d.line((12, 29, 155, 29), fill=style['trunk'])
        d.text((19, 15), 'FIND A WAY HOME', fill=style['ink'])
    else:
        d.polygon([(9, 7), (102, 7), (108, 21), (15, 21)], fill=style['ui'])
        d.text((19, 9), 'ISLAND / 01', fill=style['ink'])
    return image.resize((960, 540), Image.Resampling.NEAREST)


def processing_smoke_check():
    rgba = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    ImageDraw.Draw(rgba).rectangle((4, 4, 11, 11), fill=(30, 140, 90, 255))
    crop = rgba.crop(rgba.getbbox())
    resized = crop.resize((16, 16), Image.Resampling.NEAREST)
    sheet = Image.new('RGBA', (32, 16))
    sheet.alpha_composite(resized, (0, 0))
    sheet.alpha_composite(rgba, (16, 0))
    quantized = sheet.quantize(colors=8, method=Image.Quantize.FASTOCTREE)
    stream = io.BytesIO()
    quantized.save(stream, format='PNG')
    stream.seek(0)
    decoded = Image.open(stream).convert('RGBA')
    assert crop.size == (8, 8) and decoded.size == (32, 16)
    assert decoded.getpixel((0, 0)) == (30, 140, 90, 255)
    transparent_pixel = decoded.getpixel((16, 0))
    assert isinstance(transparent_pixel, tuple) and transparent_pixel[3] == 0
    return ['RGBA creation', 'alpha-bound crop', 'nearest-neighbor resize', 'sheet assembly', 'palette quantization', 'PNG round trip']


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {'pillowVersion': PILLOW_VERSION, 'method': 'Python/Pillow procedural direction studies; not game screenshots, generative-service outputs or production assets.', 'processingChecks': processing_smoke_check(), 'concepts': []}
    for style in STYLES:
        path = OUTPUT / f"direction-{style['id']}.png"
        render(style).save(path)
        manifest['concepts'].append({'file': path.name, 'title': style['title'], 'studyNativeSize': style['size'], 'presentationSize': [960, 540], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
