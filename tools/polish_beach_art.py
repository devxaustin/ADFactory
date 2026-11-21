"""Deterministic native-pixel Beach art. Pillow only; no resampling/AI services.

Run from any directory: python tools/polish_beach_art.py
Reference sprites are read from the immutable local base commit 63a16c4, never
from the generated output. This keeps repairs repeatable and prevents drift.
Contact sheets are inspection aids outside the game asset directory.
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
import math
import subprocess
import sys
from PIL import Image, ImageDraw, ImageOps
sys.dont_write_bytecode = True  # Keep authoring runs from leaving untracked tool caches.
from test_beach_art import ART, ROOT, SPECS, enclosed_holes

BASE='63a16c4'
O='#082f35'; G0='#14524a'; G1='#1b6b45'; G2='#2f8a45'
G3='#5baa36'; G4='#96cb2e'; G5='#cfdb47'
GREEN=[O,G0,G1,G2,G3,G4,G5]
SOURCES={}
ASSETS={}

def source(rel):
    path='games/monkey-island/public/beach/'+rel
    data=subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=ROOT)
    SOURCES[rel]=hashlib.sha256(data).hexdigest()
    return Image.open(BytesIO(data)).convert('RGBA')

def canvas(size): return Image.new('RGBA',size)

def repair(im):
    """Fill only enclosed 4-connected holes, nearest existing material color.

    Border-connected alpha (including between palm fronds) is never touched.
    Multi-source nearest color is based on the ORIGINAL opacity, not fill order.
    """
    out=im.copy(); holes=enclosed_holes(im)
    opaque=[(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]]
    for region in holes:
        for x,y in region:
            nx,ny=min(opaque,key=lambda p:((p[0]-x)**2+(p[1]-y)**2,p[1],p[0]))
            out.putpixel((x,y),im.getpixel((nx,ny)))
    return out

def save(name,im,method,folder='sprites',extra=None):
    rel=f'{folder}/{name}.png'; path=ART/rel; path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,optimize=False)
    pivot=SPECS.get(name,(None,None))[1]
    ASSETS[rel]={'size':list(im.size),'foot_pivot':list(pivot) if pivot else None,
                 'source_method':method,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    if extra: ASSETS[rel].update(extra)

def leaf(im,base,tip,width,shade=0,frond=False):
    """Broad stepped blade with lower-right shadow and upper-left planes."""
    bx,by=base; tx,ty=tip; dx=tx-bx; dy=ty-by; length=math.hypot(dx,dy)
    if not length:return
    nx=-dy/length; ny=dx/length
    def p(t,w): return (round(bx+dx*t+nx*w),round(by+dy*t+ny*w))
    edge=[p(0,0)]
    if frond:
        for t,k in ((.22,.55),(.33,.9),(.42,.65),(.52,1),(.61,.65),(.72,.85),(.81,.45),(.9,.45)):
            edge.append(p(t,width*k))
    else: edge += [p(.25,width*.6),p(.5,width),p(.76,width*.65)]
    edge += [p(1,0)]
    if frond:
        for t,k in ((.9,.5),(.8,.55),(.7,.85),(.6,.55),(.5,1),(.4,.65),(.3,.8),(.2,.45)):
            edge.append(p(t,-width*k))
    else: edge += [p(.76,-width*.65),p(.5,-width),p(.25,-width*.6)]
    d=ImageDraw.Draw(im);d.polygon(edge,fill=O)
    inner=[p(.06,0),p(.28,width*.4),p(.52,width*.78),p(.78,width*.42),p(.97,0),p(.7,-width*.55),p(.36,-width*.55)]
    d.polygon(inner,fill=GREEN[2+shade])
    d.polygon([p(.12,0),p(.4,-width*.55),p(.65,-width*.65),p(.92,0),p(.58,0)],fill=GREEN[min(5,4+shade)])
    d.line([p(.08,0),p(.6,0),p(.93,0)],fill=G3 if shade==0 else G4,width=1)
    if width>=5:
        d.line([p(.38,0),p(.5,width*.65)],fill=G1)
        d.line([p(.57,0),p(.7,width*.6)],fill=G1)
        d.line([p(.3,-width*.3),p(.47,-width*.55)],fill=G5 if shade else G4)

def cluster(size,base,tips):
    im=canvas(size)
    for i,(tip,width) in enumerate(tips):leaf(im,base,tip,width,i%2)
    return repair(im)

def plants():
    # Repair the bush's clipped bottom/right outline without resampling the plant.
    im=repair(source('sprites/bush.png')); original=im.copy()
    for x in range(im.width):
        if original.getpixel((x,im.height-1))[3]:
            im.putpixel((min(x,im.width-2),im.height-2),original.getpixel((x,im.height-1)))
        im.putpixel((x,im.height-1),(0,0,0,0))
    for y in range(im.height-1):
        if original.getpixel((im.width-1,y))[3]:
            im.putpixel((im.width-2,y),original.getpixel((im.width-1,y)))
        im.putpixel((im.width-1,y),(0,0,0,0))
    d=ImageDraw.Draw(im);d.line([(12,5),(14,7)],fill=G4);d.point((10,4),fill=G5)
    save('bush',repair(im),'Reference bush; clipped outer outline moved inward one native pixel; small upper-left leaf glints, no resampling')
    im=repair(source('sprites/flower.png'));d=ImageDraw.Draw(im)
    d.line([(5,4),(7,4)],fill='#ff8870');d.point((7,7),fill='#ffe1a1')
    save('flower',im,'Reference coral flower; warm lit petal edge and gold center glint to match new flower clusters')
    im=repair(source('sprites/fern.png'));d=ImageDraw.Draw(im)
    # Broaden alternating pinnae without making the silhouette a solid rectangle.
    for y,span in ((10,7),(14,6),(18,4)):
        d.polygon([(11,y+3),(11-span,y-1),(12-span,y-3),(12,y)],fill=G2)
        d.line([(11-span,y-2),(11,y+1)],fill=G4)
        d.polygon([(12,y+3),(12+span,y-1),(11+span,y-2),(11,y)],fill=G1)
        d.line([(12,y+1),(11+span,y-2)],fill=G3)
    save('fern',repair(im),'Reference fern; denser alternating pinnae, shared tropical palette')
    im=canvas((16,12));d=ImageDraw.Draw(im)
    d.polygon([(3,4),(5,2),(11,2),(13,4),(13,10),(2,10),(2,7)],fill='#56352b')
    d.polygon([(4,5),(11,5),(11,9),(4,9)],fill='#b87542')
    d.line([(4,6),(4,9)],fill='#e5b773');d.line([(10,6),(10,9)],fill='#855032')
    d.polygon([(3,4),(5,2),(10,2),(12,4),(10,6),(5,6)],fill='#efc98a')
    d.line([(5,3),(9,3),(10,4),(8,5),(5,4),(7,4)],fill='#b87542')
    d.point((12,10),fill=G2);d.point((2,9),fill=G3)
    save('stump',im,'Original native-pixel repaint: lit cut rings, bark planes, retained 16x12 contract')
    save('broadleaf',cluster((48,40),(24,36),[((3,18),7),((44,15),8),((12,5),8),((33,3),8),((8,28),6),((42,28),6),((22,8),7)]),'Original layered broad blades with split light planes, hand-authored native polygons')
    save('bush-b',cluster((40,28),(20,23),[((3,17),6),((37,17),6),((10,5),7),((30,4),7),((20,2),6),((5,19),5),((35,19),5),((18,10),6)]),'Original broad layered rosette; shared foliage ramp')
    im=canvas((24,16))
    for tip,w in [((3,8),2),((6,3),2),((10,2),2),((15,3),2),((20,6),2),((21,10),2)]: leaf(im,(12,14),tip,w,tip[0]%2)
    save('grass-tuft',repair(im),'Original six tapered broad grass blades, native pixel clusters')
    im=canvas((64,72));d=ImageDraw.Draw(im)
    d.polygon([(28,26),(34,26),(36,65),(31,67),(27,63)],fill='#56352b')
    d.polygon([(29,29),(32,30),(33,63),(29,64)],fill='#b87542')
    for y in range(34,64,6):
        d.line([(29,y),(33,y+2)],fill='#efc98a');d.point((33,y+3),fill='#855032')
    for tip,w in [((4,43),8),((3,25),8),((10,10),8),((22,4),8),((35,3),8),((49,8),8),((59,23),8),((59,42),8)]:leaf(im,(31,35),tip,w,tip[0]%2,True)
    for tip,w in [((13,47),7),((24,14),7),((45,18),7),((49,49),7)]:leaf(im,(31,36),tip,w,1,True)
    leaf(im,(31,66),(18,58),4,0);leaf(im,(32,66),(43,58),4,1)
    save('fan-palm',repair(im),'Original dense radial fan canopy; ringed short trunk; layered serrated blades')
    # Cropped palm is mirrored with +1 native pixel registration to foot x47.
    p=repair(source('sprites/palm.png'));im=canvas((80,96));im.alpha_composite(ImageOps.mirror(p),(1,0))
    # An extra lifted spear, broad asymmetric foreground frond, coconuts and bark accents
    # distinguish this from a mere mirrored texture without discarding reference detail.
    leaf(im,(42,30),(30,7),5,1,True)
    leaf(im,(42,31),(68,40),7,0,True)
    d=ImageDraw.Draw(im)
    for x,y in ((42,34),(47,36),(39,38)):
        d.ellipse((x-2,y-2,x+2,y+2),fill='#56352b');d.point((x-1,y-1),fill='#b87542')
    for x,y in ((47,57),(48,68),(47,78)):d.line([(x-3,y),(x,y+1)],fill='#efc98a')
    save('palm-b',repair(im),'Reference palm mirrored +1px foot registration; original lifted spear, asymmetric frond, coconuts and bark edits')

def flower_at(im,x,y,scale=1):
    d=ImageDraw.Draw(im)
    d.line([(x,y+2),(x-1,y+8)],fill=G1,width=1)
    d.polygon([(x-1,y+7),(x-5,y+4),(x-2,y+4)],fill=G3)
    d.polygon([(x,y+6),(x+4,y+3),(x+3,y+6)],fill=G2)
    d.polygon([(x-2,y-4),(x+1,y-4),(x+2,y-2),(x+4,y-2),(x+4,y+1),(x+2,y+2),(x+1,y+4),(x-2,y+3),(x-3,y+1),(x-4,y),(x-4,y-2),(x-2,y-2)],fill='#9f3e35')
    d.rectangle((x-2,y-3,x,y-1),fill='#ff8870');d.rectangle((x+1,y-1,x+3,y+1),fill='#dc594a')
    d.rectangle((x-2,y+1,x,y+2),fill='#ef6654');d.rectangle((x-1,y-1,x+1,y+1),fill='#efbb4c')
    d.point((x-1,y-1),fill='#ffe1a1')

def small_props():
    im=canvas((24,24))
    leaf(im,(12,21),(3,16),3,0);leaf(im,(12,21),(21,15),3,1)
    flower_at(im,7,10);flower_at(im,17,13);flower_at(im,13,6)
    save('flowers',repair(im),'Original three coral hibiscus-like flowers, gold centers and broad foliage')
    im=canvas((24,16));d=ImageDraw.Draw(im)
    for x,y,w,h in [(3,9,7,4),(11,5,9,7),(16,11,5,3)]:
        d.polygon([(x,y+2),(x+2,y),(x+w-2,y),(x+w,y+2),(x+w-1,y+h),(x+1,y+h)],fill='#4e4a60')
        d.polygon([(x+1,y+2),(x+2,y+1),(x+w-3,y+1),(x+w-2,y+2),(x+3,y+h-1)],fill='#a49ba2')
        d.line([(x+2,y+1),(x+w-3,y+1)],fill='#d5c6b8')
        d.point((x+w-2,y+h-1),fill='#737083')
    save('shore-rocks',im,'Original small beveled stones using reference rock ramp')
    im=canvas((16,16));d=ImageDraw.Draw(im)
    d.polygon([(2,8),(3,5),(5,4),(8,5),(9,8),(6,10),(3,10)],fill='#b87566')
    d.polygon([(3,7),(4,5),(6,5),(8,7),(6,9),(4,9)],fill='#ffe1ac')
    d.line([(5,6),(5,8),(6,9)],fill='#e3b48b');d.point((7,7),fill='#e3b48b')
    d.polygon([(10,11),(11,9),(13,9),(14,11),(13,13),(11,13)],fill='#b87566')
    d.line([(11,10),(12,10),(13,11),(11,12)],fill='#ffe1ac')
    save('shells',im,'Original scallop and small spiral shell decal, transparent background')
    im=canvas((20,20));d=ImageDraw.Draw(im)
    d.polygon([(4,17),(5,18),(14,5),(12,4)],fill='#56352b')
    d.line([(5,16),(12,6)],fill='#b87542',width=2);d.line([(5,16),(11,7)],fill='#e1b277')
    d.polygon([(8,3),(11,2),(14,3),(17,2),(18,4),(18,8),(16,10),(13,8),(11,7),(9,7)],fill='#263b48')
    d.polygon([(9,3),(11,3),(14,4),(17,3),(17,8),(16,9),(13,7),(10,6)],fill='#737e89')
    d.polygon([(15,4),(17,3),(17,8),(16,8),(15,7)],fill='#c7d3ca')
    d.line([(10,3),(12,4)],fill='#e3e0c5');d.point((14,6),fill='#4e5965')
    d.rectangle((11,5,12,6),fill='#855032');d.point((12,5),fill='#c18a52')
    save('axe',im,'Original 20x20 diagonal wooden haft, weathered steel wedge and bright bevel')
    im=canvas((28,20));d=ImageDraw.Draw(im)
    # Elongated diagonal hoagie, open top: bread is a long split roll, never a bun stack.
    d.polygon([(2,10),(4,6),(9,4),(21,3),(25,5),(26,8),(24,12),(19,14),(7,16),(3,14)],fill='#855032')
    d.polygon([(3,10),(5,7),(10,5),(21,4),(24,6),(24,9),(20,12),(7,14),(4,13)],fill='#edbd78')
    d.polygon([(5,9),(8,7),(21,5),(23,7),(20,11),(7,13)],fill='#56352b')
    # Discrete chopped browned beef clusters.
    for x,y in [(7,9),(10,8),(14,8),(18,7),(21,7),(10,11),(15,10),(19,9)]:
        d.rectangle((x,y,x+2,y+1),fill='#a56840');d.point((x,y),fill='#c18a52')
    d.polygon([(6,8),(8,7),(11,8),(14,6),(17,7),(21,5),(22,6),(19,8),(17,8),(16,10),(13,9),(11,10),(8,9),(7,11)],fill='#f0cc58')
    d.line([(8,7),(10,8),(14,6),(16,7)],fill='#ffe1a1')
    d.line([(5,12),(8,13),(21,10),(24,8)],fill='#ffdc9c')
    d.line([(6,6),(11,5)],fill='#ffe1ac');d.line([(16,4),(20,4)],fill='#ffe1ac')
    d.point((8,14),fill='#b87542');d.point((18,12),fill='#b87542')
    save('cheesesteak',im,'Original elongated split toasted hoagie with browned chopped steak and melted gold cheese')

# Original character palette; no sampled legacy player or licensed character.
CO={'o':'#26343d','hair':'#3c2d2d','hairlit':'#674137','skin':'#d68d5d','skinlit':'#f1bb81','skinshade':'#a56043','shirt':'#268e7e','shirtlit':'#65b99b','shirtshade':'#166260','band':'#db5b50','bandlit':'#ff8b70','pants':'#866a4a','pantslit':'#b28e5d','boot':'#593e35','bootlit':'#986044','pack':'#ba8c45','packlit':'#edc36d','packshade':'#876234'}

def character_frame(direction,phase):
    im=canvas((20,28));d=ImageDraw.Draw(im)
    def box(b,c):d.rectangle(b,fill=CO.get(c,c))
    def poly(p,c):d.polygon(p,fill=CO.get(c,c))
    def line(p,c,width=1):d.line(p,fill=CO.get(c,c),width=width)
    # Separate leg silhouettes: walk frames change foot length, height, knee and gap.
    if direction in (0,3):
        if phase==0: legs=[(6,20,8,25),(11,20,13,25)]
        elif phase==1: legs=[(5,20,8,25),(11,20,13,23)]
        else: legs=[(6,20,8,23),(11,20,14,25)]
        for i,(x,y,r,b) in enumerate(legs):
            box((x,y,r,b),'o');box((x+1,y,r,b-2),'pantslit' if i==0 else 'pants')
            box((x,b-1,r,b),'boot');box((x,b,r+(1 if i else 0),min(26,b+1)),'o');box((x+1,b-1,r,b-1),'bootlit')
        # Arms swing independently of feet and torso.
        left_y=14+(1 if phase==1 else -1 if phase==2 else 0)
        right_y=14+(-1 if phase==1 else 1 if phase==2 else 0)
        for x,y in ((4,left_y),(14,right_y)):
            box((x,y,x+2,y+5),'o');box((x+1,y,x+1,y+2),'shirtlit' if x==4 else 'shirt')
            box((x+1,y+3,x+1,y+4),'skinlit' if x==4 else 'skin')
        poly([(7,11),(12,11),(14,14),(13,21),(6,21),(5,14)],'o')
        poly([(7,12),(12,12),(13,14),(12,20),(7,20),(6,14)],'shirt')
        box((7,13,8,19),'shirtlit');box((12,15,12,20),'shirtshade')
        if direction==0:
            box((7,12,7,17),'packlit');box((12,12,12,17),'packshade')
            box((8,20,11,20),'packshade');box((9,20,10,20),'packlit')
        else:
            poly([(7,12),(12,12),(14,15),(13,20),(6,20),(5,15)],'o')
            box((7,13,12,19),'pack');box((7,13,11,14),'packlit')
            box((7,16,11,19),'packshade');box((8,16,11,18),'pack')
            box((9,17,10,17),'packlit')
        # Head has stepped jaw, ear silhouette and bandana knot.
        poly([(7,2),(12,2),(14,4),(14,9),(12,11),(8,11),(6,9),(5,5)],'o')
        box((7,3,12,8),'hair');box((7,3,10,3),'hairlit')
        box((6,7,6,8),'skin');box((14,7,14,8),'skinshade')
        if direction==0:
            poly([(7,6),(12,6),(13,8),(11,10),(8,10),(7,9)],'skin')
            box((8,6,11,8),'skinlit');box((8,7,8,7),'o');box((11,7,11,7),'o')
            box((9,9,10,9),'skinshade');box((6,4,13,5),'band');box((7,4,11,4),'bandlit')
            box((9,6,10,6),'skinlit')
        else:
            box((6,4,13,5),'band');box((7,4,11,4),'bandlit');box((7,6,12,9),'hair')
            box((8,6,10,7),'hairlit');box((10,5,11,6),'bandlit')
        poly([(13,5),(16,6),(15,9),(14,7)],'band');box((15,6,15,7),'bandlit')
    else:
        # Left profile is drawn independently; right profile then corrected for
        # fixed world upper-left lighting after a geometric mirror.
        backx=12
        if phase==0:
            legs=[(7,20,9,25),(11,20,13,24)]
        elif phase==1:legs=[(5,20,8,25),(11,20,14,23)]
        else:legs=[(8,20,11,23),(12,20,15,25)]
        for i,(x,y,r,b) in enumerate(legs):
            poly([(x,y),(r,y),(r,b),(x-1,b),(x-1,b-1)],'o')
            box((x,y,r-1,b-2),'pantslit' if i==0 else 'pants')
            box((x-1,b-1,r-1,b),'boot');box((x,b-1,r-1,b-1),'bootlit')
        # Far arm and backpack behind the shirt.
        box((6,13,8,18),'shirtshade');box((6,18,7,20),'skinshade')
        poly([(12,12),(15,13),(16,18),(14,20),(11,19)],'o')
        box((13,13,14,18),'pack');box((13,13,14,14),'packlit');box((14,17,15,18),'packshade')
        poly([(8,11),(12,11),(13,14),(12,21),(7,21),(6,15)],'o')
        poly([(8,12),(11,12),(12,14),(11,20),(8,20),(7,14)],'shirt')
        box((8,13,9,16),'shirtlit');box((11,13,11,18),'packlit')
        armx,army=((8,15) if phase==0 else (5,14) if phase==1 else (10,15))
        poly([(9,13),(11,14),(armx+2,army+4),(armx,army+5),(armx-1,army+3)],'o')
        box((9,14,10,15),'shirtlit');box((armx,army+2,armx+1,army+4),'skin');box((armx,army+2,armx,army+3),'skinlit')
        poly([(8,2),(12,2),(14,4),(14,9),(11,11),(8,10),(7,9),(5,8),(6,6),(6,4)],'o')
        box((8,3,12,8),'hair');box((8,3,10,3),'hairlit')
        poly([(7,6),(10,6),(11,9),(10,10),(8,10),(7,9),(6,8)],'skin')
        box((7,6,9,7),'skinlit');box((7,7,7,7),'o');box((10,7,11,8),'skinshade')
        box((7,4,13,5),'band');box((8,4,11,4),'bandlit')
        poly([(13,5),(16,6),(16,8),(14,7)],'band');box((15,6,16,6),'bandlit')
        if direction==2:
            im=ImageOps.mirror(im);d=ImageDraw.Draw(im)
            # Re-light rather than simply inheriting reversed highlights.
            d.line([(7,13),(7,18)],fill=CO['packlit'])
            d.line([(10,13),(10,15)],fill=CO['shirtlit'])
            d.point((7,3),fill=CO['hairlit'])
    return im

def player():
    im=canvas((60,112))
    for row in range(4):
        for col in range(3): im.alpha_composite(character_frame(row,col),(col*20,row*28))
    save('adventure-player',im,'Original hand-authored pixel character, 12 independently articulated frames; upper-left light',extra={'frame_size':[20,28],'columns':['idle','stepA','stepB'],'rows':['down','left','right','up'],'feet_y':26,'physics_offset':[6,20],'legacy_player_unchanged':True})

def shores():
    old=source('terrain/shore-0.png')
    for n in range(4):
        im=source(f'terrain/shore-{n}.png');d=ImageDraw.Draw(im)
        # Interior detail only: both full endpoint columns remain byte-identical.
        for x in range(1,15):
            # Native one-pixel wet-sand band below pre-existing foam.
            ys=[y for y in range(4,10) if im.getpixel((x,y))[:3]==(229,247,223)]
            y=max(ys) if ys else 7
            if y+2<16:
                d.point((x,y+1),fill='#edba77')
                if (x+n)%4 in (1,2):d.point((x,y+2),fill='#efc383')
            if (x+2*n)%6 in (1,2): d.point((x,max(1,y-2)),fill='#8de3d2')
            if (x+n)%7==3:d.point((x,y),fill='#fff1c6')
        for x in (0,15):
            for y in range(16):im.putpixel((x,y),old.getpixel((x,y)))
        save(f'shore-b-{n}',im,'Existing shore variant with restrained native foam flecks and wet-sand accents; exact shore-0 endpoint columns',folder='terrain',extra={'boundary_endpoint_y':6})

def contact_sheet(path):
    entries=list(ASSETS)
    cellw,cellh=186,224
    im=Image.new('RGB',(cellw*5,cellh*math.ceil(len(entries)/5)),'#f5cf8c');d=ImageDraw.Draw(im)
    for i,rel in enumerate(entries):
        a=Image.open(ART/rel); x=(i%5)*cellw;y=(i//5)*cellh
        d.text((x+3,y+3),Path(rel).stem,fill='#26343d')
        scale=min(3,(cellw-8)//a.width,(cellh-22)//a.height)
        a=a.resize((a.width*scale,a.height*scale),Image.Resampling.NEAREST)
        im.paste(a,(x+3,y+20),a)
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path)
    player_image=Image.open(ART/'sprites/adventure-player.png')
    player_image.resize((360,672),Image.Resampling.NEAREST).save(path.parent/'adventure-player-review.png')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--contact-sheet',type=Path,default=ROOT/'tools/artifacts/beach-assets-contact-sheet.png');args=parser.parse_args()
    holes={}
    for name in ('rock-a','rock-b','palm'):
        im=source(f'sprites/{name}.png');before=enclosed_holes(im);out=repair(im);after=enclosed_holes(out)
        holes[name]={'before_components':len(before),'before_pixels':sum(map(len,before)),'after_components':len(after),'after_pixels':sum(map(len,after))}
        extra={'alpha_holes':holes[name],
               'repaired_alpha_coordinates':sorted([list(p) for region in before for p in region]),
               'original_rgba_sha256':hashlib.sha256(im.tobytes()).hexdigest()}
        if name=='palm': extra['interactive_display_origin']=[33,76]
        save(name,out,'Reference-derived sprite; enclosed-alpha nearest-material repair only, border-connected frond gaps preserved',extra=extra)
    plants();small_props();player();shores()
    manifest={'schema':1,'authoring':'tools/polish_beach_art.py; Python + Pillow only, integer pixel drawing, no antialiasing or paid services','base_commit':BASE,'source_hashes':SOURCES,'alpha_hole_measurement':'4-connected zero-alpha components not touching image border','alpha_holes':holes,'palette':{'foliage':GREEN,'rock':['#4e4a60','#737083','#a49ba2','#d5c6b8'],'character':CO},'assets':ASSETS}
    (ART/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    contact_sheet(args.contact_sheet)
    print(json.dumps({'generated_assets':len(ASSETS),'alpha_holes':holes,'contact_sheet':str(args.contact_sheet)},indent=2))

if __name__=='__main__':main()
