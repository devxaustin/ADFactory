"""Production beach asset contracts; run: python tools/test_beach_art.py."""
import hashlib
import json
from collections import deque
from pathlib import Path
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'games/monkey-island/public/beach'
SPECS = {
    'palm': ((80,96),(33,89)), 'palm-b': ((80,96),(47,89)),
    'rock-a': ((48,40),(24,37)), 'rock-b': ((64,48),(32,45)),
    'fan-palm': ((64,72),(32,66)), 'broadleaf': ((48,40),(24,38)),
    'bush-b': ((40,28),(20,26)), 'grass-tuft': ((24,16),(12,14)),
    'flowers': ((24,24),(12,22)), 'shore-rocks': ((24,16),(12,14)),
    'shells': ((16,16),None), 'axe': ((20,20),None),
    'cheesesteak': ((28,20),None), 'adventure-player': ((60,112),None),
    'bush': ((32,24),None), 'fern': ((24,24),None),
    'flower': ((16,16),None), 'stump': ((16,12),None),
}

def enclosed_holes(im):
    """Count 4-connected enclosed transparent components and their pixels."""
    a = im.convert('RGBA').getchannel('A'); w,h = im.size
    remaining = {(x,y) for y in range(h) for x in range(w) if a.getpixel((x,y)) == 0}
    holes=[]
    while remaining:
        first=remaining.pop(); q=deque([first]); region=[first]; edge=False
        while q:
            x,y=q.popleft(); edge |= x in (0,w-1) or y in (0,h-1)
            for n in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if n in remaining: remaining.remove(n); q.append(n); region.append(n)
        if not edge: holes.append(region)
    return holes

class BeachArtTests(unittest.TestCase):
    def test_sprite_contracts(self):
        for name,(size,_) in SPECS.items():
            with self.subTest(asset=name):
                path=ART/'sprites'/f'{name}.png'
                self.assertTrue(path.exists(), f'missing {name}')
                with Image.open(path) as im:
                    self.assertEqual(im.size,size)
                    self.assertEqual(im.mode,'RGBA')
                    self.assertTrue(set(im.getchannel('A').get_flattened_data()) <= {0,255})
                    self.assertIsNotNone(im.getbbox())
    def test_clean_transparent_margins(self):
        for name in SPECS:
            if name == 'adventure-player': continue
            path=ART/'sprites'/f'{name}.png'
            if not path.exists(): continue
            im=Image.open(path).convert('RGBA'); alpha=im.getchannel('A')
            with self.subTest(asset=name):
                self.assertFalse(any(alpha.crop((0,0,im.width,1)).tobytes()))
                self.assertFalse(any(alpha.crop((0,im.height-1,im.width,im.height)).tobytes()))
                self.assertFalse(any(alpha.crop((0,0,1,im.height)).tobytes()))
                self.assertFalse(any(alpha.crop((im.width-1,0,im.width,im.height)).tobytes()))

    def test_repaired_interiors(self):
        for name in ('palm','rock-a','rock-b'):
            with self.subTest(asset=name):
                self.assertEqual(len(enclosed_holes(Image.open(ART/'sprites'/f'{name}.png'))),0)
    def test_walk_frames_actually_change(self):
        path=ART/'sprites/adventure-player.png'
        self.assertTrue(path.exists(),'missing original player')
        im=Image.open(path).convert('RGBA')
        rows=[]
        for row in range(4):
            frames=[im.crop((col*20,row*28,col*20+20,row*28+28)) for col in range(3)]
            self.assertEqual(len({f.tobytes() for f in frames}),3)
            # Reject a translated duplicate, even when that would change many pixels.
            from PIL import ImageChops
            for dx in range(-2,3):
                for dy in range(-2,3):
                    shifted=ImageChops.offset(frames[1],dx,dy)
                    self.assertNotEqual(shifted.tobytes(),frames[2].tobytes())
            # Limb-region pixels really change between opposite steps.
            self.assertGreater(sum(a!=b for a,b in zip(frames[1].crop((0,12,20,27)).get_flattened_data(),frames[2].crop((0,12,20,27)).get_flattened_data())),12)
            for frame in frames:
                self.assertGreaterEqual(frame.getbbox()[3],26)
                self.assertLessEqual(frame.getbbox()[3],27)
                self.assertFalse(any(frame.getpixel((x,0))[3] for x in range(20)))
            rows.append(frames[0].tobytes())
        self.assertEqual(len(set(rows)),4)
    def test_shore_endpoints(self):
        for n in range(4):
            path=ART/'terrain'/f'shore-b-{n}.png'
            self.assertTrue(path.exists(),f'missing shore-b-{n}')
            im=Image.open(path).convert('RGBA'); old=Image.open(ART/'terrain/shore-0.png').convert('RGBA')
            self.assertEqual(im.size,(16,16))
            for x in (0,15):
                self.assertEqual([im.getpixel((x,y)) for y in range(16)],[old.getpixel((x,y)) for y in range(16)])
    def test_reference_repairs_preserve_silhouette_and_existing_colors(self):
        # Offline reconstruction of original RGBA bytes: no git/history/reference file.
        manifest=json.loads((ART/'asset-manifest.json').read_text())
        for name in ('palm','rock-a','rock-b'):
            item=manifest['assets'][f'sprites/{name}.png']
            restored=Image.open(ART/'sprites'/f'{name}.png').convert('RGBA')
            for x,y in item['repaired_alpha_coordinates']:
                self.assertEqual(restored.getpixel((x,y))[3],255)
                restored.putpixel((x,y),(0,0,0,0))
            self.assertEqual(hashlib.sha256(restored.tobytes()).hexdigest(),item['original_rgba_sha256'])
            holes=enclosed_holes(restored)
            self.assertEqual(len(holes),item['alpha_holes']['before_components'])
            self.assertEqual(sum(map(len,holes)),item['alpha_holes']['before_pixels'])

    def test_manifest_matches_files(self):
        path=ART/'asset-manifest.json'
        self.assertTrue(path.exists(),'missing asset manifest')
        manifest=json.loads(path.read_text())
        for name,(size,pivot) in SPECS.items():
            item=manifest['assets'][f'sprites/{name}.png']
            self.assertEqual(item['size'],list(size))
            self.assertEqual(item['foot_pivot'],list(pivot) if pivot else None)
        for path,item in manifest['assets'].items():
            data=(ART/path).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(),item['sha256'])
            self.assertTrue(item['source_method'])

if __name__=='__main__': unittest.main(verbosity=2)
