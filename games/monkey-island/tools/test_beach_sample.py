"""Validate the review-only Beach sample; no Phaser or runtime source changes."""
import hashlib
import json
from pathlib import Path
from typing import cast
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / 'art' / 'beach-sample-v1'


class BeachSampleTests(unittest.TestCase):
    def manifest(self):
        path = SAMPLE / 'manifest.json'
        self.assertTrue(path.exists(), 'Representative asset sample has not been produced yet')
        return json.loads(path.read_text(encoding='utf-8'))

    def test_representative_roles_and_dimensions_exist(self):
        m = self.manifest()
        assets = {a['id']: a for a in m['assets']}
        required = {
            'sand-a': [16, 16], 'sand-b': [16, 16], 'sand-c': [16, 16],
            'rock-a': [48, 40], 'rock-b': [64, 48], 'palm': [80, 96],
            'stump': [16, 12], 'bush': [32, 24], 'fern': [24, 24],
            'flower': [16, 16], 'axe': [16, 16], 'cheesesteak': [24, 16],
        }
        for name, size in required.items():
            self.assertIn(name, assets)
            self.assertEqual(assets[name]['size'], size)
        self.assertEqual(m['reviewStatus'], 'AWAITING_SAMPLE_APPROVAL')
        self.assertFalse(m['runtimeIntegrated'])
        self.assertEqual(len(m['palette']), 32)

    def test_export_hash_dimensions_alpha_and_palette(self):
        m = self.manifest()
        palette = {tuple(bytes.fromhex(c.lstrip('#'))) for c in m['palette']}
        for asset in m['assets']:
            path = SAMPLE / asset['file']
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), asset['sha256'])
            with Image.open(path) as im:
                self.assertEqual(list(im.size), asset['size'])
                self.assertEqual(im.mode, 'RGBA')
                pixels = cast(list[tuple[int, int, int, int]], list(im.get_flattened_data()))
                alphas = {p[3] for p in pixels}
                allowed = {0, 96} if asset['role'] == 'shadow' else {0, 255}
                self.assertTrue(alphas <= allowed, (asset['id'], alphas))
                self.assertTrue({p[:3] for p in pixels if p[3]} <= palette, asset['id'])
                if asset['role'] == 'terrain':
                    self.assertEqual(alphas, {255})
                else:
                    self.assertIn(0, alphas)
                    self.assertTrue(im.getbbox())

    def test_repeatable_tiles_meet_sample_edge_contract(self):
        for asset in self.manifest()['assets']:
            if not asset.get('repeatX') and not asset.get('repeatY'):
                continue
            with Image.open(SAMPLE / asset['file']) as im:
                if asset.get('repeatX'):
                    for y in range(im.height):
                        self.assertEqual(im.getpixel((0, y)), im.getpixel((im.width - 1, y)), asset['id'])
                if asset.get('repeatY'):
                    for x in range(im.width):
                        self.assertEqual(im.getpixel((x, 0)), im.getpixel((x, im.height - 1)), asset['id'])
        # Equality at exported edges is a sample contract, not proof of aesthetic seam quality.

    def test_layout_retains_source_obstacles_and_interactions(self):
        m = self.manifest()
        self.assertEqual(m['logicalSize'], [480, 270])
        self.assertEqual(m['baselineCollisionRects'], [
            {'kind': 'water', 'x': 0, 'y': 0, 'w': 480, 'h': 40},
            {'kind': 'rock', 'x': 150, 'y': 90, 'w': 32, 'h': 32},
            {'kind': 'rock', 'x': 300, 'y': 170, 'w': 48, 'h': 32},
        ])
        self.assertEqual(m['baselineInteractions'], {
            'beach-axe': [190, 150], 'beach-cheesesteak': [235, 115], 'beach-tree': [420, 215],
        })
        self.assertEqual(m['eastOpening'], {'x': 440, 'y': 105, 'w': 40, 'h': 60})
        for name, size in [('mockup.png', (480, 270)), ('mockup-3x.png', (1440, 810)), ('mockup-collision-plan.png', (960, 540))]:
            with Image.open(SAMPLE / name) as im:
                self.assertEqual(im.size, size)

    def test_offline_review_board_and_water_preview(self):
        board = SAMPLE / 'review.html'
        self.assertTrue(board.exists(), 'Self-contained approval board has not been produced yet')
        text = board.read_text(encoding='utf-8')
        self.assertNotIn('{{', text)
        self.assertIn('NOT a Phaser screenshot', text)
        for control in ['data-zoom="1"', 'data-zoom="2"', 'data-zoom="3"', 'data-view="collision"']:
            self.assertIn(control, text)
        self.assertNotIn('src="http', text)
        with Image.open(SAMPLE / 'water-loop.gif') as im:
            frames = getattr(im, 'n_frames', 1)
            self.assertEqual(frames, 4)
            self.assertEqual(im.info['loop'], 0)
            for i in range(frames):
                im.seek(i)
                self.assertEqual(im.info['duration'], 250)

    def test_animation_groups_are_complete_and_nonconstant(self):
        m = self.manifest()
        for family in ['water-deep', 'water-shallow', 'shore', 'depth-edge']:
            frames = [a for a in m['assets'] if a.get('animation') == family]
            self.assertEqual([a['frame'] for a in frames], [0, 1, 2, 3])
            self.assertGreater(len({a['sha256'] for a in frames}), 1)
            self.assertTrue(all(a['size'] == [16, 16] for a in frames))


if __name__ == '__main__':
    unittest.main(verbosity=2)
