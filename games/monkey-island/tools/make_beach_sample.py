"""Build a review-only modular Beach sample with Pillow (not a Phaser scene).

Usage: python tools/make_beach_sample.py --reference ORIGINAL.png --baseline BEFORE.png
The private original is read locally, hash checked, and NEVER copied into the repo.
No runtime src/public files are written. Candidate props derived from the user's
reference are disclosed in the manifest; terrain/small props are code-authored.
"""
import argparse
import base64
import colorsys
import hashlib
import json
import math
from pathlib import Path
import random
from typing import cast
from PIL import Image, ImageDraw, ImageFont, __version__ as PILLOW_VERSION

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'art' / 'beach-sample-v1'
REFERENCE_SHA = 'f80dc18550addd5c7cddb3f83adab994356902e15345d58971c91d04a3ec2e48'
HEX = [
    '#082F35', '#14524A', '#1B6B45', '#2F8A45', '#5BAA36', '#96CB2E', '#CFDB47',
    '#C18A52', '#D9A25F', '#EDBA77', '#F5CF8C', '#FFE0A0',
    '#005483', '#007CAE', '#069EC4', '#1AC5D4', '#61E0D5', '#B3F1DB', '#E5F7DF',
    '#4E4A60', '#737083', '#A49BA2', '#D5C6B8',
    '#56352B', '#855032', '#B87542', '#E3A35B', '#9D283A', '#D84A3D', '#FF7855',
    '#BCCED0', '#ECF3E8',
]
RGB = [tuple(bytes.fromhex(h[1:])) for h in HEX]
assert len(RGB) == 32 and len(set(RGB)) == 32
C = {h: rgb + (255,) for h, rgb in zip(HEX, RGB)}


def rgba(size):
    return Image.new('RGBA', size, (0, 0, 0, 0))


def recolor(im):
    """Map visible colors to the proposed core palette; retain binary masks."""
    palette = Image.new('P', (1, 1))
    palette.putpalette([v for rgb in RGB for v in rgb] * 8)
    result = im.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    result.putalpha(im.getchannel('A'))
    return result


def remove_tiny_islands(mask, minimum=12):
    pixels = mask.load()
    if pixels is None:
        raise ValueError('No mask pixels')
    seen = set()
    for y in range(mask.height):
        for x in range(mask.width):
            if (x, y) in seen or not pixels[x, y]:
                continue
            stack, component = [(x, y)], []
            seen.add((x, y))
            while stack:
                px, py = stack.pop()
                component.append((px, py))
                for nx, ny in [(px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)]:
                    if 0 <= nx < mask.width and 0 <= ny < mask.height and (nx, ny) not in seen and pixels[nx, ny]:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if len(component) < minimum:
                for px, py in component:
                    pixels[px, py] = 0
    return mask


def reference_prop(source, box, target, kind):
    """Explicit reference-derived study: bounded masks, palette cleanup, native export.
    This cannot recover hidden artwork; final production still needs approval.
    """
    crop = source.crop(box).convert('RGBA')
    mask = Image.new('L', crop.size, 0)
    support = Image.new('L', crop.size, 0)
    sd = ImageDraw.Draw(support)
    if kind == 'palm':
        trunk = [(1120, 625), (1172, 625), (1185, 681), (1173, 729),
                 (1161, 782), (1156, 816), (1105, 816), (1110, 765), (1120, 710)]
        sd.polygon([(x - box[0], y - box[1]) for x, y in trunk], fill=255)
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, _ = cast(tuple[int, int, int, int], crop.getpixel((x, y)))
            _, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            green = g > r * 1.02 and g > b * .88
            ink = max(r, g, b) < 86
            stone = saturation < .28 and value < .94
            if kind == 'palm':
                trunk_pixel = bool(support.getpixel((x, y))) and r < 244 and r >= g >= b
                base_stone = y + box[1] > 790 and 1088 < x + box[0] < 1215 and stone
                keep = green or (ink and (green or support.getpixel((x, y)))) or trunk_pixel or base_stone
            else:
                keep = green or ink or stone
            if keep:
                mask.putpixel((x, y), 255)
    mask = remove_tiny_islands(mask)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError(f'Empty {kind} mask')
    crop.putalpha(mask)
    cut = crop.crop(bounds)
    scale = min((target[0] - 4) / cut.width, (target[1] - 4) / cut.height)
    size = (max(1, round(cut.width * scale)), max(1, round(cut.height * scale)))
    cut = recolor(cut.resize(size, Image.Resampling.NEAREST))
    cut.putalpha(remove_tiny_islands(cut.getchannel('A'), minimum=3))
    canvas = rgba(target)
    left, top = (target[0] - size[0]) // 2, target[1] - size[1] - 2
    canvas.alpha_composite(cut, (left, top))
    if kind == 'palm':
        anchor = [round(left + (1140 - box[0] - bounds[0]) * size[0] / (bounds[2] - bounds[0])),
                  round(top + (815 - box[1] - bounds[1]) * size[1] / (bounds[3] - bounds[1]))]
    else:
        anchor = [target[0] // 2, target[1] - 3]
    return canvas, anchor


def tile(kind, frame=0, variant=0):
    base = '#F5CF8C' if kind == 'sand' else '#007CAE' if kind == 'water-deep' else '#1AC5D4'
    im = Image.new('RGBA', (16, 16), C[base])
    d = ImageDraw.Draw(im)
    if kind == 'sand':
        # Restrained clustered marks; quiet perimeter makes the seam contract explicit.
        for x, y, length in ([[3, 5, 4], [9, 11, 3]] if variant == 0 else [[6, 9, 3]] if variant == 1 else []):
            d.line((x, y, min(13, x + length), y), fill=C['#EDBA77'])
            d.point((min(13, x + length), y - 1), fill=C['#FFE0A0'])
    elif kind.startswith('water-'):
        light = '#069EC4' if kind == 'water-deep' else '#61E0D5'
        for y, start in [(4, 3), (11, 8)]:
            for n in range(5):
                x = 2 + ((start + frame * 3 + n) % 12)
                d.point((x, y), fill=C[light])
                if n in [1, 2]:
                    d.point((x, y + 1), fill=C[light])
    else:
        is_shore = kind == 'shore'
        im.paste(C['#F5CF8C'] if is_shore else C['#1AC5D4'], (0, 0, 16, 16))
        for x in range(16):
            edge = 6 if x in [0, 15] else 6 + [0, 0, 1, 1, 0, -1, -1, 0][(x + frame * 2) % 8]
            d.line((x, 0, x, edge), fill=C['#1AC5D4'] if is_shore else C['#007CAE'])
            d.point((x, edge + 1), fill=C['#E5F7DF'] if is_shore else C['#069EC4'])
            if is_shore:
                d.point((x, edge + 2), fill=C['#EDBA77'])
        if is_shore:
            for x in range(3 + frame, 13, 5):
                d.point((x, 3), fill=C['#61E0D5'])
    return im


def small_prop(name):
    size = {'bush': (32, 24), 'fern': (24, 24), 'flower': (16, 16),
            'stump': (16, 12), 'axe': (16, 16), 'cheesesteak': (24, 16)}[name]
    im, d = rgba(size), None
    d = ImageDraw.Draw(im)
    if name == 'bush':
        d.polygon([(1, 18), (3, 12), (9, 7), (12, 2), (20, 2), (26, 7), (30, 12), (31, 20), (25, 23), (8, 23)], fill=C['#082F35'])
        d.polygon([(3, 17), (6, 10), (12, 7), (15, 3), (20, 4), (24, 9), (28, 11), (29, 19), (22, 22), (10, 21)], fill=C['#1B6B45'])
        for tip, bend, color in [((3, 10), (8, 8), '#2F8A45'), ((8, 3), (13, 5), '#5BAA36'), ((17, 2), (20, 7), '#2F8A45'), ((26, 5), (26, 10), '#5BAA36'), ((30, 13), (28, 18), '#2F8A45')]:
            tx, ty = tip
            bx, by = bend
            d.polygon([(16, 21), (tx, ty), (bx, by), (20, 19)], fill=C[color])
            d.line((tx + (1 if tx < 16 else -1), ty + 2, bx, by + 1), fill=C['#96CB2E'], width=2)
        d.line((10, 21, 21, 22), fill=C['#14524A'])
    elif name == 'fern':
        d.line((11, 21, 12, 5), fill=C['#1B6B45'], width=2)
        for y, length in [(7, 5), (11, 8), (15, 9), (19, 6)]:
            for direction in [-1, 1]:
                tip = 12 + direction * length
                d.polygon([(12, y + 1), (tip, y - 5), (tip - direction, y - 1), (12, y + 3)], fill=C['#14524A'])
                d.line((12, y, tip - direction, y - 3), fill=C['#5BAA36'], width=2)
    elif name == 'flower':
        d.line((7, 13, 8, 6), fill=C['#1B6B45'], width=2)
        d.polygon([(7, 12), (3, 8), (2, 10), (6, 14)], fill=C['#5BAA36'])
        for box in [(5, 2, 9, 6), (2, 5, 7, 9), (9, 5, 13, 9), (5, 8, 10, 12)]:
            d.rectangle(box, fill=C['#9D283A'])
            d.rectangle((box[0] + 1, box[1], box[2], box[3] - 1), fill=C['#D84A3D'])
        d.rectangle((6, 5, 9, 8), fill=C['#E3A35B'])
        d.point((6, 5), fill=C['#FFE0A0'])
    elif name == 'stump':
        d.polygon([(2, 4), (5, 2), (11, 2), (14, 4), (13, 9), (9, 10), (3, 9)], fill=C['#56352B'])
        d.rectangle((4, 5, 11, 8), fill=C['#B87542'])
        d.polygon([(3, 4), (6, 2), (10, 2), (13, 4), (10, 6), (6, 6)], fill=C['#E3A35B'])
        d.line((6, 4, 9, 4), fill=C['#855032'])
    elif name == 'axe':
        d.line((4, 13, 11, 3), fill=C['#082F35'], width=4)
        d.line((4, 12, 10, 4), fill=C['#B87542'], width=2)
        d.polygon([(3, 3), (7, 1), (11, 4), (9, 9), (4, 7)], fill=C['#082F35'])
        d.polygon([(4, 3), (7, 2), (10, 4), (8, 8), (5, 6)], fill=C['#BCCED0'])
        d.polygon([(6, 3), (8, 4), (7, 7), (5, 6)], fill=C['#D84A3D'])
        d.line((4, 3, 4, 5), fill=C['#ECF3E8'])
    else:
        # Long split hoagie roll, browned chopped steak and melted cheese; no burger/lettuce band.
        d.polygon([(1, 7), (3, 5), (7, 3), (19, 2), (22, 4), (22, 8), (19, 11), (6, 14), (2, 12)], fill=C['#56352B'])
        d.polygon([(2, 7), (5, 5), (9, 4), (19, 3), (21, 4), (19, 6), (6, 9), (3, 9)], fill=C['#E3A35B'])
        d.line((5, 6, 17, 4), fill=C['#FFE0A0'], width=2)
        for x, y in [(7, 5), (12, 4), (16, 3)]:
            d.line((x, y, x + 1, y + 1), fill=C['#F5CF8C'])
        for x, y in [(4, 9), (8, 8), (12, 7), (17, 6)]:
            d.rectangle((x, y, x + 3, y + 2), fill=C['#855032'])
            d.point((x + 2, y), fill=C['#B87542'])
        d.line((5, 10, 18, 7), fill=C['#F5CF8C'])
        d.point((9, 10), fill=C['#FFE0A0'])
        d.line((4, 12, 18, 9), fill=C['#E3A35B'], width=2)
        d.line((6, 13, 17, 11), fill=C['#EDBA77'])
    return im


def shadow(size):
    im = rgba(size)
    d = ImageDraw.Draw(im)
    w, h = size
    d.polygon([(2, h // 2), (w // 4, 2), (w * 3 // 4, 2), (w - 3, h // 2),
               (w * 3 // 4, h - 3), (w // 4, h - 3)], fill=RGB[0] + (96,))
    return im


def paste_at(canvas, image, point, anchor):
    canvas.alpha_composite(image, (round(point[0] - anchor[0]), round(point[1] - anchor[1])))


def compose(images, anchors, player, frame=0):
    rng = random.Random(1908)
    room = Image.new('RGBA', (480, 270), C['#F5CF8C'])
    for y in range(0, 270, 16):
        for x in range(0, 480, 16):
            if y < 16:
                key = f'water-deep-{(frame + x // 16 * 3) % 4}'
            elif y == 16:
                key = f'depth-edge-{frame}'
            elif y == 32:
                key = f'shore-{frame}'
            else:
                key = ['sand-a', 'sand-b'][rng.randrange(2)] if rng.random() < .22 else 'sand-c'
            room.alpha_composite(images[key], (x, y))
    # Low vegetation frames the room; preserve a generous east opening y105..165.
    for x in range(-8, 480, 26):
        paste_at(room, images['bush'], (x, 269), (16, 23))
    for y in range(70, 260, 25):
        paste_at(room, images['bush'], (3, y), (16, 23))
    for y in [66, 88, 208, 234, 262]:
        paste_at(room, images['bush'], (477, y), (16, 23))
    for point in [(28, 124), (17, 235), (458, 220), (453, 92)]:
        paste_at(room, images['flower'], point, (8, 14))
    for point in [(33, 182), (80, 258), (278, 260), (472, 190), (448, 65)]:
        paste_at(room, images['fern'], point, (12, 22))
    objects = [
        ('palm', (39, 97), anchors['palm']), ('palm', (443, 85), anchors['palm']),
        ('rock-a', (166, 122), anchors['rock-a']),
        ('rock-b', (324, 202), anchors['rock-b']),
        ('palm', (17, 264), anchors['palm']), ('palm', (420, 228), anchors['palm']),
        ('axe', (190, 150), (8, 8)), ('cheesesteak', (235, 115), (12, 8)),
        ('player', (80, 147), (8, 24)),
    ]
    for key, point, anchor in sorted(objects, key=lambda entry: entry[1][1]):
        if key == 'palm':
            paste_at(room, images['shadow-palm'], (point[0] + 13, point[1] + 2), (24, 8))
        elif key.startswith('rock'):
            shade = images[f'shadow-{key}']
            paste_at(room, shade, (point[0] + 4, point[1] - 2), (shade.width // 2, 8))
        elif key in ['axe', 'cheesesteak', 'player']:
            paste_at(room, images['shadow-small'], (point[0] + 2, point[1] + (5 if key != 'player' else 0)), (8, 3))
        paste_at(room, player if key == 'player' else images[key], point, anchor)
    return room


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', type=Path, required=True)
    parser.add_argument('--baseline', type=Path, required=True)
    args = parser.parse_args()
    data = args.reference.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != REFERENCE_SHA:
        raise ValueError('Expected the reviewed user reference; use a separately reviewed version for another source')
    with Image.open(args.reference) as opened:
        source = opened.convert('RGB')
    OUT.mkdir(parents=True, exist_ok=True)
    images, assets, anchors = {}, [], {}

    def register(name, im, role, method='code-authored pixel sample', **metadata):
        folder = OUT / ('terrain' if role == 'terrain' else 'sprites')
        folder.mkdir(exist_ok=True)
        path = folder / f'{name}.png'
        im.save(path)
        images[name] = im
        assets.append({'id': name, 'file': path.relative_to(OUT).as_posix(), 'size': list(im.size),
                       'role': role, 'method': method, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), **metadata})

    for n, suffix in enumerate(['a', 'b', 'c']):
        register(f'sand-{suffix}', tile('sand', variant=n), 'terrain', repeatX=True, repeatY=True)
    for family in ['water-deep', 'water-shallow', 'shore', 'depth-edge']:
        for frame in range(4):
            register(f'{family}-{frame}', tile(family, frame=frame), 'terrain', animation=family, frame=frame,
                     repeatX=True, repeatY=family.startswith('water-'))
    for name, box, size, kind in [
        ('rock-a', (385, 270, 605, 435), (48, 40), 'rock'),
        ('rock-b', (535, 460, 825, 665), (64, 48), 'rock'),
        ('palm', (1008, 484, 1324, 835), (80, 96), 'palm'),
    ]:
        im, anchor = reference_prop(source, box, size, kind)
        anchors[name] = anchor
        register(name, im, 'scenery', 'reference-derived bounded mask, native nearest-neighbor resample and core-palette mapping; candidate cleanup, not final art',
                 referenceCrop=list(box), anchor=anchor)
    for name in ['bush', 'fern', 'flower', 'stump', 'axe', 'cheesesteak']:
        register(name, small_prop(name), 'pickup' if name in ['axe', 'cheesesteak'] else 'scenery')
    for name, size in [('shadow-rock-a', (48, 16)), ('shadow-rock-b', (64, 16)), ('shadow-palm', (48, 16)), ('shadow-small', (16, 6))]:
        register(name, shadow(size), 'shadow')

    with Image.open(ROOT / 'public/sprites/player.png') as sheet:
        player = sheet.convert('RGBA').crop((0, 0, 16, 24))
    room = compose(images, anchors, player)
    room.save(OUT / 'mockup.png')
    room.resize((1440, 810), Image.Resampling.NEAREST).save(OUT / 'mockup-3x.png')
    frames = [compose(images, anchors, player, frame=f).resize((960, 540), Image.Resampling.NEAREST).convert('RGB') for f in range(4)]
    frames[0].save(OUT / 'water-loop.gif', save_all=True, append_images=frames[1:], duration=250, loop=0, disposal=2)
    overlay = room.copy()
    d = ImageDraw.Draw(overlay, 'RGBA')
    for rect in [(0, 0, 479, 39), (150, 90, 181, 121), (300, 170, 347, 201), (415, 222, 424, 227)]:
        d.rectangle(rect, outline=(255, 50, 60, 255), width=1)
    d.rectangle((440, 105, 479, 164), outline=(40, 255, 160, 255), width=2)
    overlay.resize((960, 540), Image.Resampling.NEAREST).save(OUT / 'mockup-collision-plan.png')

    # Review contact sheet only; labels/background are not production sprites.
    cols, cell = 6, (144, 128)
    rows = math.ceil(len(assets) / cols)
    contact = Image.new('RGB', (cols * cell[0], rows * cell[1]), '#192A2C')
    cd = ImageDraw.Draw(contact)
    font = ImageFont.load_default(size=11)
    for i, asset in enumerate(assets):
        x, y = (i % cols) * cell[0], (i // cols) * cell[1]
        for cy in range(y + 4, y + 108, 8):
            for cx in range(x + 4, x + 140, 8):
                cd.rectangle((cx, cy, cx + 7, cy + 7), fill='#34484A' if ((cx - x) // 8 + (cy - y) // 8) % 2 else '#283C40')
        im = images[asset['id']]
        scale = min(3, max(1, min(128 // im.width, 96 // im.height)))
        show = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
        contact.paste(show, (x + (144 - show.width) // 2, y + 4 + (104 - show.height) // 2), show)
        cd.text((x + 5, y + 111), asset['id'], fill='#F5CF8C', font=font)
    contact.save(OUT / 'contact-sheet.png')
    palette_im = Image.new('RGB', (32 * 24, 48))
    pd = ImageDraw.Draw(palette_im)
    for i, color in enumerate(HEX):
        pd.rectangle((i * 24, 0, i * 24 + 23, 47), fill=color)
    palette_im.save(OUT / 'palette.png')
    if args.baseline:
        with Image.open(args.baseline) as old:
            before = old.convert('RGB').resize((480, 270), Image.Resampling.NEAREST)
        comparison = Image.new('RGB', (960, 294), '#122326')
        comparison.paste(before, (0, 24))
        comparison.paste(room.convert('RGB'), (480, 24))
        ImageDraw.Draw(comparison).text((8, 6), 'BEFORE: engine capture / placeholder art', fill='#E5F7DF', font=font)
        ImageDraw.Draw(comparison).text((488, 6), 'AFTER: review mockup / NOT Phaser gameplay', fill='#E5F7DF', font=font)
        comparison.resize((1920, 588), Image.Resampling.NEAREST).save(OUT / 'comparison.png')

    manifest = {
        'reviewStatus': 'AWAITING_SAMPLE_APPROVAL', 'runtimeIntegrated': False,
        'logicalSize': [480, 270], 'tileSize': [16, 16], 'palette': HEX,
        'reference': {'sha256': digest, 'size': list(source.size), 'rawPublished': False},
        'pillowVersion': PILLOW_VERSION,
        'provenance': 'Terrain and small props are original local code-authored studies; palm/rocks are disclosed derivatives of the user-approved reference. Existing player reused only for scale. No image service or AI generation called.',
        'limitations': ['No Phaser gameplay is running in the mockup', 'No gameplay/collision playtest is claimed', 'Reference-derived masking/resampling requires visual approval and further pixel cleanup', 'One palm type and limited small vegetation are samples, not the full family', 'Only representative straight shore/depth transitions supplied; corner kit deferred', 'Loop is an exported visual preview, not a runtime animation integration'],
        'baselineCollisionRects': [
            {'kind': 'water', 'x': 0, 'y': 0, 'w': 480, 'h': 40},
            {'kind': 'rock', 'x': 150, 'y': 90, 'w': 32, 'h': 32},
            {'kind': 'rock', 'x': 300, 'y': 170, 'w': 48, 'h': 32},
        ],
        'baselineInteractions': {'beach-axe': [190, 150], 'beach-cheesesteak': [235, 115], 'beach-tree': [420, 215]},
        'eastOpening': {'x': 440, 'y': 105, 'w': 40, 'h': 60},
        'assets': assets,
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    template = (ROOT / 'tools/beach_review_template.html').read_text(encoding='utf-8')
    for token, file_name in {'MOCKUP': 'mockup.png', 'WATER': 'water-loop.gif', 'COLLISION': 'mockup-collision-plan.png', 'COMPARISON': 'comparison.png', 'CONTACT': 'contact-sheet.png'}.items():
        mime = 'gif' if file_name.endswith('.gif') else 'png'
        uri = f'data:image/{mime};base64,' + base64.b64encode((OUT / file_name).read_bytes()).decode('ascii')
        template = template.replace('{{' + token + '}}', uri)
    template = template.replace('{{PALETTE}}', ''.join(f'<span style="background:{h}" title="{h}"></span>' for h in HEX))
    template = template.replace('{{ASSET_COUNT}}', str(len(assets)))
    if '{{' in template:
        raise ValueError('Unresolved review template token')
    (OUT / 'review.html').write_text(template, encoding='utf-8')
    print(json.dumps({'sampleAssets': len(assets), 'reviewStatus': manifest['reviewStatus'], 'output': str(OUT), 'anchors': anchors}, indent=2))


if __name__ == '__main__':
    main()
