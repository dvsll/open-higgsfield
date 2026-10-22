"""Remote-only exact-file downloader. No download on import or without --approved."""
import hashlib, json, os, pathlib, sys, urllib.request
def main():
    if sys.argv[1:] != ['--approved']:
        print('DRY RUN: five pinned BF16 files (~71.1GB). Requires explicit approval and gated HF access.'); return
    pins = json.loads(pathlib.Path(__file__).with_name('pins.json').read_text())
    token = os.environ['HF_TOKEN']
    base = pathlib.Path('/workspace/adstudio-benchmark/ComfyUI/models')
    for w in pins['weights']:
        path = base / w['path']; path.parent.mkdir(parents=True, exist_ok=True)
        def digest(p):
            h=hashlib.sha256()
            with p.open('rb') as f:
                for b in iter(lambda:f.read(16*1024*1024), b''): h.update(b)
            return h.hexdigest()
        if path.exists():
            if path.stat().st_size == w['bytes'] and digest(path) == w['sha256']: continue
            raise RuntimeError('Existing mismatched weight; refuse to overwrite: '+str(path))
        part=path.with_suffix(path.suffix+'.part')
        offset=part.stat().st_size if part.exists() else 0
        url=f"https://huggingface.co/{pins['modelRepo']}/resolve/{pins['modelRevision']}/{w['path']}"
        req=urllib.request.Request(url,headers={'Authorization':'Bearer '+token, **({'Range':f'bytes={offset}-'} if offset else {})})
        with urllib.request.urlopen(req,timeout=60) as r:
            if offset and r.status!=206: raise RuntimeError('Range not honored; refusing to append')
            with part.open('ab' if offset else 'wb') as out:
                while data:=r.read(16*1024*1024): out.write(data)
        assert part.stat().st_size==w['bytes'] and digest(part)==w['sha256'], w['path']
        part.rename(path)
        print('Verified:',w['path'])
if __name__=='__main__': main()
