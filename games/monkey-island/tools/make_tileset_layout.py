#!/usr/bin/env python3
"""Generates the Monkey Island tileset layout: guide PNG, manifest JSON, and the tile tables for the markdown spec.

Needs Pillow (pip install pillow). Run from games/monkey-island:  python3 tools/make_tileset_layout.py art
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLS = 16
TILE = 16
SCALE = 4
CELL = TILE * SCALE

# ---------------------------------------------------------------------------
# Block definitions. Order matters: indices are assigned in this order and never move.
# Append new blocks at the END of this list only.
#
# fields: section, name, w, h, layer, solid, prio, req, anim, note
#   layer : str, or list of one layer name per row (top to bottom)
#   solid : 'yes' | 'no' | free text
#   prio  : 1 = needed to reskin the current game, 2 = polish / variety, 3 = new areas
#   req   : cells that must exist for the block to be usable (rest are optional variants)
#   anim  : number of consecutive animation frames (0 = static)
# ---------------------------------------------------------------------------
B = []


def add(section, name, w, h, layer, solid, prio, req=None, anim=0, note=""):
    B.append(dict(section=section, name=name, w=w, h=h, layer=layer, solid=solid, prio=prio,
                  req=(w * h if req is None else req), anim=anim, note=note))


S = "1. Ground (opaque, fills the whole tile)"
add(S, "grass", 4, 1, "ground", "no", 1, 1, note="4 variants A-D to break up repetition. Only A is required.")
add(S, "jungle_floor", 4, 1, "ground", "no", 1, 1, note="Darker, richer than grass.")
add(S, "sand", 4, 1, "ground", "no", 1, 1)
add(S, "dirt", 4, 1, "ground", "no", 1, 1, note="Paths and village ground.")
add(S, "volcanic_rock", 4, 1, "ground", "no", 1, 1, note="Dark rock for the volcano.")
add(S, "planks", 4, 1, "ground", "no", 1, 2, note="A = horizontal boards, B = vertical boards (required). C-D extra variants. Dock and village floors.")
add(S, "stone_floor", 4, 1, "ground", "no", 3, 1, note="Ruins.")
add(S, "cave_floor", 4, 1, "ground", "no", 3, 1, note="Cave.")

S = "2. Animated ground (frames must be consecutive, left to right)"
add(S, "deep_water", 4, 1, "ground", "yes", 1, 4, anim=4, note="4-frame loop. Not walkable.")
add(S, "lava", 4, 1, "ground", "yes", 1, 4, anim=4, note="4-frame loop. Not walkable.")
add(S, "shallow_water", 4, 1, "ground", "no", 3, 4, anim=4, note="Walkable lagoon water.")
add(S, "steam_vent", 3, 1, "objects", "yes", 2, 3, anim=3, note="Volcano vents. Transparent background.")

S = "3. Edge sets (transparent OUTSIDE, patch terrain INSIDE)"
EDGE_NOTE = ("5x3 block. Layout: TL T TR | inner-TL inner-TR / L (fill) R | inner-BL inner-BR / BL B BR | spare. "
             "Draw the patch terrain on the inside of each border and leave the outside transparent so it works over any ground. "
             "The centre fill cell is optional (a copy of the patch ground, just for reference).")
for name, prio, extra in [
    ("shore", 1, "Patch = deep_water, over sand. Add foam / wet-sand rim."),
    ("sand_patch", 1, "Patch = sand, over grass."),
    ("path", 1, "Patch = dirt, over grass or jungle floor."),
    ("jungle_edge", 2, "Patch = jungle_floor, over grass."),
    ("lava_rim", 1, "Patch = lava, over volcanic rock. Add a glowing rim."),
    ("pier_edge", 1, "Patch = planks, over water. Dock and pier borders."),
    ("cliff_wall", 3, "Raised cliff edges over grass. Waterfall and cave approaches."),
    ("cave_wall", 3, "Cave rock walls over cave floor."),
    ("lagoon_edge", 3, "Patch = shallow_water, over sand."),
]:
    add(S, f"{name}_edge" if not name.endswith("edge") else name, 5, 3, "detail", "no (cliff/cave: yes)" if name in ("cliff_wall", "cave_wall") else "no", prio, 12, note=f"{extra} {EDGE_NOTE}")

S = "4. Decor (detail layer, transparent, walkable)"
add(S, "grass_tuft", 4, 1, "detail", "no", 1, 2)
add(S, "flowers", 4, 1, "detail", "no", 1, 2, note="Mix of colours (this is where the 'brighter, more colourful' look comes from).")
add(S, "pebbles", 3, 1, "detail", "no", 1, 2)
add(S, "shells", 3, 1, "detail", "no", 1, 2, note="Beach.")
add(S, "volcanic_cracks", 3, 1, "detail", "no", 1, 2, note="Glowing cracks, volcano.")
add(S, "fern", 3, 1, "detail", "no", 2, 1)
add(S, "dark_tuft", 3, 1, "detail", "no", 2, 1, note="Jungle undergrowth.")
add(S, "mushroom", 2, 1, "detail", "no", 2, 1)
add(S, "starfish", 1, 1, "detail", "no", 2, 1)
add(S, "driftwood_bits", 2, 1, "detail", "no", 2, 1)
add(S, "leaf_litter", 3, 1, "detail", "no", 2, 1)
add(S, "bones", 2, 1, "detail", "no", 2, 1, note="Volcano / shipwreck.")
add(S, "moss", 3, 1, "detail", "no", 3, 1, note="Ruins.")
add(S, "lily_pads", 3, 1, "detail", "no", 3, 1, note="Lagoon (draw on water-coloured background).")
add(S, "reeds", 3, 1, "detail", "no", 3, 1, note="Lagoon edges.")

S = "5. Small props (objects layer, 1x1 each)"
add(S, "bush", 3, 1, "objects", "yes", 1, 2)
add(S, "small_rock", 3, 1, "objects", "yes", 1, 2)
add(S, "barrel", 2, 1, "objects", "yes", 1, 1)
add(S, "crate", 2, 1, "objects", "yes", 1, 1)
add(S, "sign", 2, 1, "objects", "yes", 1, 1, note="Wooden signpost.")
add(S, "fence", 7, 1, "objects", "yes", 1, 3, note="Order: horizontal, vertical, post (required), then corners TL, TR, BL, BR.")
add(S, "pier_post", 2, 1, "objects", "yes", 1, 1, note="Wooden posts standing in the water.")
add(S, "bramble_gate", 4, 1, "gate:<flag>", "yes", 1, 2, note="The Tiger's thicket. Painted on a 'gate:tiger_fed' layer; vanishes when the flag is set. A-B required (variants).")
add(S, "stump", 1, 1, "objects", "yes", 2, 1, note="Decorative stump (choppable trees leave their own sprite stump).")
add(S, "fallen_log", 2, 1, "objects", "yes", 2, 1)
add(S, "torch", 3, 1, "objects", "yes", 2, 3, anim=3, note="3-frame flame loop on a post.")
add(S, "campfire", 4, 1, "objects", "yes", 2, 4, anim=3, note="Cells 1-3 = lit (3-frame loop), cell 4 = unlit embers.")
add(S, "obsidian_spike", 2, 1, "objects", "yes", 2, 1)
add(S, "crystal", 3, 1, "objects", "yes", 3, 1, note="Cave.")
add(S, "stalagmite", 2, 1, "objects", "yes", 3, 1, note="Cave.")

S = "6. Stamps (multi-tile scenery; pick them as one block in Tiled)"
TREE_ROWS = ["above", "above", "above", "objects"]
add(S, "jungle_tree_a", 3, 4, TREE_ROWS, "base row, centre trunk tile only", 1, note="Canopy 3x3 drawn OVER the player, trunk base solid.")
add(S, "palm_tree", 3, 4, TREE_ROWS, "base row, centre trunk tile only", 1, note="Beach palm. Top 3 rows over the player.")
add(S, "jungle_tree_b", 3, 4, TREE_ROWS, "base row, centre trunk tile only", 2, note="Variant so forests do not look cloned.")
add(S, "hut_small", 3, 3, ["above", "above", "objects"], "bottom row (door tile too)", 1, note="Roof 2 rows over the player; wall + door on the bottom row.")
add(S, "hut_large", 5, 4, ["above", "above", "objects", "objects"], "bottom 2 rows", 2, note="Coconut King's hut.")
add(S, "dead_tree", 2, 3, ["above", "objects", "objects"], "bottom 2 rows", 2, note="Volcano.")
add(S, "boulder", 4, 2, "objects", "yes", 1, 4, note="Two 2x2 boulder variants side by side; one is required.")
add(S, "rock_cluster", 3, 2, "objects", "yes", 2)
add(S, "well", 2, 2, "objects", "yes", 2, note="Village well.")
add(S, "lava_boulder", 2, 2, "objects", "yes", 2)
add(S, "obsidian_spire", 2, 3, ["above", "objects", "objects"], "bottom 2 rows", 2)
add(S, "totem", 1, 3, ["above", "objects", "objects"], "bottom 2 rows", 2, note="Village totem pole.")

S = "7. New-area stamps (priority 3, draw these later)"
add(S, "shipwreck_hull", 5, 4, ["above", "objects", "objects", "objects"], "bottom 3 rows", 3, note="Beached ship.")
add(S, "broken_mast", 1, 3, ["above", "objects", "objects"], "bottom 2 rows", 3)
add(S, "cave_mouth", 3, 3, ["above", "above", "objects"], "bottom row except the entrance", 3, note="Entrance to the cave: leave the middle bottom tile walkable (that is where the exit object sits).")
add(S, "ruins_arch", 4, 3, ["above", "above", "objects"], "bottom row except the opening", 3)
add(S, "statue", 2, 3, ["above", "objects", "objects"], "bottom 2 rows", 3)
add(S, "pillars", 2, 3, ["above", "objects", "objects"], "bottom 2 rows", 3, note="Left = intact pillar, right = broken pillar.")
add(S, "altar", 2, 2, "objects", "yes", 3)
add(S, "temple_door", 2, 3, ["above", "objects", "objects"], "bottom row except the doorway", 3)
add(S, "boulder_gate", 2, 2, "gate:<flag>", "yes", 3, note="Rockfall gate for 'gate:<flag>' layers.")
add(S, "vine_gate", 2, 2, "gate:<flag>", "yes", 3, note="Vine wall gate for 'gate:<flag>' layers.")
add(S, "stone_steps", 3, 2, "detail", "no", 3)
add(S, "waterfall_top", 3, 1, "objects", "yes", 3, 3, anim=3, note="3-frame loop. Stack top / mid / base for a falling column.")
add(S, "waterfall_mid", 3, 1, "objects", "yes", 3, 3, anim=3)
add(S, "waterfall_base", 3, 1, "objects", "yes", 3, 3, anim=3, note="Splash where it lands.")
add(S, "bridge_h", 3, 1, "objects", "walkable (overrides water)", 3, note="Left end, middle, right end.")
add(S, "bridge_v", 1, 3, "objects", "walkable (overrides water)", 3, note="Top end, middle, bottom end.")
add(S, "stepping_stones", 3, 1, "objects", "walkable (overrides water)", 3)

# ---------------------------------------------------------------------------
# Shelf packing. A new section always starts on a fresh shelf (row).
# ---------------------------------------------------------------------------
placed = []
cur_section = None
shelf_y = 0
shelf_h = 0
cursor_x = 0
for b in B:
    if b["section"] != cur_section:
        shelf_y += shelf_h
        shelf_h = 0
        cursor_x = 0
        cur_section = b["section"]
    if cursor_x + b["w"] > COLS:
        shelf_y += shelf_h
        shelf_h = 0
        cursor_x = 0
    b["x"], b["y"] = cursor_x, shelf_y
    b["first_index"] = shelf_y * COLS + cursor_x
    cursor_x += b["w"]
    shelf_h = max(shelf_h, b["h"])
    placed.append(b)
ROWS = shelf_y + shelf_h

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)

SECTION_COLORS = {
    "1": (201, 179, 126), "2": (127, 184, 232), "3": (155, 209, 139), "4": (244, 166, 198),
    "5": (183, 154, 122), "6": (143, 176, 160), "7": (176, 160, 200),
}
PRIO_COLORS = {1: (220, 40, 40), 2: (240, 150, 20), 3: (110, 110, 120)}

W, H = COLS * CELL, ROWS * CELL
MARGIN_L, MARGIN_T = 36, 62
img = Image.new("RGB", (W + MARGIN_L + 8, H + MARGIN_T + 8), (30, 32, 38))
d = ImageDraw.Draw(img)
f_idx = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 10)
f_lab = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 11)
f_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 9)

d.text((8, 6), "Tile index = row x 16 + column.   Outline: RED = P1 (needed to reskin the current game)   ORANGE = P2 (polish)   GREY = P3 (new areas)", font=f_small, fill=(230, 230, 235))
d.text((8, 20), "Dimmed cells = optional variants.   Edge sets: draw the patch terrain on the INSIDE of each border, leave the OUTSIDE transparent.", font=f_small, fill=(230, 230, 235))
for c in range(COLS):
    d.text((MARGIN_L + c * CELL + CELL // 2 - 4, 44), str(c), font=f_idx, fill=(200, 200, 210))
for r in range(ROWS):
    d.text((6, MARGIN_T + r * CELL + CELL // 2 - 6), f"r{r}", font=f_idx, fill=(200, 200, 210))

# empty cells
for r in range(ROWS):
    for c in range(COLS):
        x0, y0 = MARGIN_L + c * CELL, MARGIN_T + r * CELL
        d.rectangle([x0, y0, x0 + CELL - 1, y0 + CELL - 1], fill=(44, 46, 54), outline=(60, 62, 72))


EDGE_ROLES = [
    ["TL", "top", "TR", "in-TL", "in-TR"],
    ["left", "fill", "right", "in-BL", "in-BR"],
    ["BL", "bottom", "BR", "spare", "spare"],
]


def wrap(text, width_px, font):
    words, lines, line = text.replace("_", " ").split(" "), [], ""
    for w in words:
        t = (line + " " + w).strip()
        if d.textlength(t, font=font) <= width_px:
            line = t
        else:
            if line:
                lines.append(line)
            line = w
    lines.append(line)
    return lines


for b in placed:
    base = SECTION_COLORS[b["section"][0]]
    for i in range(b["w"] * b["h"]):
        cx, cy = i % b["w"], i // b["w"]
        x0 = MARGIN_L + (b["x"] + cx) * CELL
        y0 = MARGIN_T + (b["y"] + cy) * CELL
        optional = i >= b["req"] and b["w"] * b["h"] > b["req"] and not (b["w"] == 5 and b["h"] == 3)
        col = tuple(int(v * 0.55 + 70 * 0.45) for v in base) if optional else base
        d.rectangle([x0, y0, x0 + CELL - 1, y0 + CELL - 1], fill=col, outline=(20, 20, 24))
        idx = (b["y"] + cy) * COLS + b["x"] + cx
        d.text((x0 + 3, y0 + CELL - 13), str(idx), font=f_idx, fill=(20, 20, 24))
        if b["w"] == 5 and b["h"] == 3:
            role = EDGE_ROLES[cy][cx]
            d.text((x0 + 4, y0 + 24), role, font=f_small, fill=(20, 60, 20))
        elif b["h"] == 1 and b["w"] in (3, 4, 5, 7) and not b["anim"]:
            d.text((x0 + CELL - 14, y0 + CELL - 14), "ABCDEFG"[cx], font=f_small, fill=(30, 30, 36))
        elif b["anim"]:
            d.text((x0 + CELL - 18, y0 + CELL - 14), f"f{cx + 1}", font=f_small, fill=(30, 30, 36))
    # priority outline
    px0, py0 = MARGIN_L + b["x"] * CELL, MARGIN_T + b["y"] * CELL
    px1, py1 = px0 + b["w"] * CELL - 1, py0 + b["h"] * CELL - 1
    d.rectangle([px0, py0, px1, py1], outline=PRIO_COLORS[b["prio"]], width=3)
    # label
    label_w = b["w"] * CELL - 10
    lines = wrap(b["name"], label_w, f_lab)
    ty = py0 + 4
    for ln in lines[:3]:
        d.text((px0 + 5, ty), ln, font=f_lab, fill=(15, 15, 20))
        ty += 13
    tags = f"{b['w']}x{b['h']}" + (f"  anim{b['anim']}" if b["anim"] else "")
    d.text((px0 + 5, ty + 1), tags, font=f_small, fill=(15, 15, 20))

# legend strip at the bottom margin handled in markdown; save PNG
img.save(out / "tileset_guide.png")

manifest = dict(
    tileSize=TILE, columns=COLS, rows=ROWS, tileCount=COLS * ROWS,
    note="Append-only: existing indices never move. New blocks are added at the bottom.",
    blocks=[dict(name=b["name"], section=b["section"], x=b["x"], y=b["y"], w=b["w"], h=b["h"],
                 firstIndex=b["first_index"], layer=b["layer"], solid=b["solid"], priority=b["prio"],
                 requiredCells=b["req"], animFrames=b["anim"], note=b["note"]) for b in placed],
)
(out / "tileset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

# Markdown tables
by_prio = {1: 0, 2: 0, 3: 0}
for b in placed:
    by_prio[b["prio"]] += b["req"]
total_cells = sum(b["w"] * b["h"] for b in placed)

md = []
md.append("<!-- GENERATED by make_tileset_layout.py. Do not hand-edit the tables. -->\n")
sec = None
for b in placed:
    if b["section"] != sec:
        sec = b["section"]
        md.append(f"\n### {sec}\n")
        md.append("| Top-left index | Cell (col,row) | Name | Size | Layer | Solid | Anim | Pri | Required | Notes |")
        md.append("|---|---|---|---|---|---|---|---|---|---|")
    layer = b["layer"] if isinstance(b["layer"], str) else " / ".join(b["layer"][:1]) + (" ... " + b["layer"][-1] if len(b["layer"]) > 1 else "")
    if not isinstance(b["layer"], str):
        layer = ", ".join(f"r{i}:{l}" for i, l in enumerate(b["layer"]))
    req = f"{b['req']}/{b['w'] * b['h']}"
    md.append(f"| {b['first_index']} | ({b['x']},{b['y']}) | `{b['name']}` | {b['w']}x{b['h']} | {layer} | {b['solid']} | "
              f"{b['anim'] or '-'} | P{b['prio']} | {req} | {b['note']} |")
(out / "tables.md").write_text("\n".join(md) + "\n")

summary = dict(rows=ROWS, width_px=COLS * TILE, height_px=ROWS * TILE, blocks=len(placed),
               total_cells=total_cells, required_by_priority=by_prio)
(out / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps(summary, indent=2))
