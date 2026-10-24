"""Local comparison artifacts only; never changes a raw model PNG."""
import hashlib,html,json,pathlib
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=pathlib.Path('outputs/qwen-hero-benchmark');SESSION=ROOT/'session'
def main():
 manifest=json.loads((ROOT/'input.json').read_text());items=[('Original photograph',ROOT/'original-reference.jpeg')];records=[]
 for kind in ['lighting','cinematic']:
  p=SESSION/'candidates'/kind;r=json.loads((p/'render.json').read_text());raw=p/'raw.png'
  assert r['status']=='complete' and hashlib.sha256(raw.read_bytes()).hexdigest()==r['rawSha256'];items.append(('A · Product-preserving enhancement' if kind=='lighting' else 'B · Cinematic bakery photograph',raw));records.append(r)
 assert hashlib.sha256(items[0][1].read_bytes()).hexdigest()==manifest['originalSha256']
 sheet=Image.new('RGB',(1800,920),'#17130f');draw=ImageDraw.Draw(sheet)
 try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',23)
 except OSError:font=ImageFont.load_default()
 for i,(label,path) in enumerate(items):
  im=ImageOps.exif_transpose(Image.open(path)).convert('RGB');im.thumbnail((560,800),Image.Resampling.LANCZOS);sheet.paste(im,(i*600+(600-im.width)//2,70));draw.text((i*600+20,20),label,font=font,fill='#fff5e4')
 draw.text((20,880),'RAW Qwen-Image-Edit-2511 FP8 outputs · seed42 · not owner-approved',font=font,fill='#fff5e4');sheet.save(SESSION/'comparison.jpg',quality=96)
 figures=[]
 for i,(label,path) in enumerate(items):
  src='../original-reference.jpeg' if i==0 else 'candidates/'+('lighting' if i==1 else 'cinematic')+'/raw.png';figures.append(f'<figure><a href="{src}"><img src="{src}" alt="{html.escape(label)}"></a><figcaption>{html.escape(label)}</figcaption></figure>')
 (SESSION/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><title>Actual Qwen hero comparison · owner review</title><style>body{font:16px Arial;background:#17130f;color:#fff5e4;margin:28px}section{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;flex:1;min-width:260px;max-width:650px}img{width:100%;max-height:850px;object-fit:contain}figcaption{margin-top:12px}p{max-width:1000px;line-height:1.6}a{color:#edbb81}pre{white-space:pre-wrap}</style><h1>Qwen-Image-Edit-2511 · two real candidates</h1><p>Original nine-roll photograph, not an AI-enhanced input. Raw model PNGs have no finishing, logo or typography. Both candidates remain unapproved. Compare roll count/structure, frosting, spirals, dough, invented details and believable lighting; successful inference alone is not a quality pass.</p><section>'+''.join(figures)+'</section>'+''.join('<details><summary>'+html.escape(r['case'])+' · exact prompt and provenance</summary><pre>'+html.escape(r['prompt'])+'</pre><p>Seed42 ·40steps ·CFG4 ·euler/simple ·FP8mixed · '+str(round(r['seconds'],1))+'s elapsed</p><a href="candidates/'+r['case']+'/render.json">Full execution/hash record</a></details>' for r in records),encoding='utf8')
 print('Verified raw hashes and original; comparison.jpg/gallery.html saved. Owner approval PENDING.')
if __name__=='__main__':main()
