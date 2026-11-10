from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json, math

root = Path(__file__).resolve().parents[2]
out = root / 'artifacts' / 'prints-codigo'
out.mkdir(parents=True, exist_ok=True)
specs = json.loads((Path(__file__).parent / 'trechos.json').read_text(encoding='utf-8'))
W,H = 2560,1440
fontdir=Path('C:/Windows/Fonts')
def font(size,bold=False,mono=False):
    return ImageFont.truetype(str(fontdir / ('consolab.ttf' if bold and mono else 'consola.ttf' if mono else 'segoeuib.ttf' if bold else 'segoeui.ttf')),size)

def wrapped(lines, maxcols):
    result=[]
    for line in lines:
        chars=[]
        for token in line['tokens']:
            chars.extend((c,token['color']) for c in token['text'])
        chunks=[]
        while len(chars)>maxcols:
            candidates=[i+1 for i,(c,_) in enumerate(chars[:maxcols]) if c.isspace() and i>maxcols//2]
            cut=candidates[-1] if candidates else maxcols
            chunks.append(chars[:cut]);chars=chars[cut:]
        chunks.append(chars)
        for i,chunk in enumerate(chunks):
            result.append({'n':line['n'] if i==0 else None,'chars':chunk,'highlight':line['highlight'],'continuation':i>0})
    return result

for s in specs:
    im=Image.new('RGB',(W,H),'#08090c')
    pix=im.load()
    for y in range(H):
        for x in range(W):
            glow=math.exp(-(((x-2310)/1050)**2+((y-70)/760)**2))
            pix[x,y]=(int(9+12*glow),int(10+9*glow),int(14+2*glow))
    d=ImageDraw.Draw(im)
    yellow='#f3c21a'
    d.text((112,70),f"DERMYS   /   {s['id'][:2]}",font=font(29,True),fill=yellow)
    d.text((112,117),s['title'],font=font(65,True),fill='#f4f4f6')
    d.text((115,208),s['kicker'],font=font(23),fill='#9a9daa')
    box=(104,280,W-104,H-100)
    shadow=Image.new('RGBA',(W,H)); sd=ImageDraw.Draw(shadow)
    sd.rounded_rectangle((box[0],box[1]+18,box[2],box[3]+22),radius=30,fill=(0,0,0,170))
    im=Image.alpha_composite(im.convert('RGBA'),shadow.filter(ImageFilter.GaussianBlur(25)))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle(box,radius=28,fill='#111318',outline='#30333e',width=2)
    d.line((box[0]+1,box[1]+88,box[2]-1,box[1]+88),fill='#2b2e38',width=2)
    for cx,col in [(146,'#ff625b'),(179,'#ffbe44'),(212,'#00ca4e')]:
        d.ellipse((cx-9,box[1]+35,cx+9,box[1]+53),fill=col)
    name=Path(s['file']).name
    d.text((255,box[1]+27),name,font=font(29,mono=True),fill='#d4d7e2')
    lang='TYPESCRIPT'
    length=d.textlength(lang,font=font(21,True))
    d.text((box[2]-length-36,box[1]+32),lang,font=font(21,True),fill=yellow)
    code_x=244; max_width=box[2]-code_x-48
    size=40
    while True:
        f=font(size,mono=True); char_width=d.textlength('M',font=f)
        rows=wrapped(s['lines'],int(max_width/char_width)-3)
        line_h=int(size*1.44)
        if len(rows)*line_h <= 862 or size<=29:break
        size-=1
    first_y=box[1]+125
    y=first_y+max(0,(862-len(rows)*line_h)//2)
    numf=font(max(22,size-5),mono=True)
    for row in rows:
        if row['highlight']:
            d.rectangle((box[0]+2,y-7,box[2]-2,y+line_h-7),fill='#25251c')
            d.rectangle((box[0]+2,y-7,box[0]+5,y+line_h-7),fill=yellow)
        if row['n'] is not None:
            n=str(row['n']);d.text((208-d.textlength(n,font=numf),y+4),n,font=numf,fill='#646a7c')
        x=code_x+(2*char_width if row['continuation'] else 0)
        for c,col in row['chars']:
            d.text((x,y),c,font=f,fill=col);x+=char_width
        y+=line_h
    d.text((112,H-64),s['file'],font=font(23,mono=True),fill='#898e9e')
    im.convert('RGB').save(out / f"{s['id']}.png",optimize=True)
    print(s['id'],f'{W}x{H}',f'fonte {size}',f'{len(rows)} linhas')

# Contato privado para conferir enquadramento e consistência antes da entrega.
sheet=Image.new('RGB',(1280,math.ceil(len(specs)/2)*360),'#08090c')
for i,s in enumerate(specs):
    thumb=Image.open(out/f"{s['id']}.png");thumb.thumbnail((640,360))
    sheet.paste(thumb,((i%2)*640,(i//2)*360))
sheet.save(Path(__file__).parent/'conferencia.jpg')
