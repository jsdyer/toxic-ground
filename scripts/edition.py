"""Write a verified, versioned snapshot and expand it into regional files for Pages."""
from datetime import datetime, timezone
from decimal import Decimal
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
import gzip, json, os, zipfile, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PROVINCES = {'British Columbia':'BC', 'Nova Scotia':'NS'}
def source(url, name):
    cached = os.environ.get('COOLCODE_SOURCE_DIR')
    if cached:
        return (Path(cached) / name).read_bytes()
    with urlopen(Request(url,headers={'User-Agent':'CoolCode public record browser'}),timeout=120) as response:
        return response.read()
def elements(raw, wanted):
    import io
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        items=[x for x in z.infolist() if x.filename.lower().endswith('.xml')]
        if len(items)!=1 or items[0].file_size>800_000_000:raise ValueError('Unexpected XML package')
        with z.open(items[0]) as infile:
            for _,el in ET.iterparse(infile):
                if el.tag in wanted:
                    yield el
                    el.clear()
def txt(el, path):
    return (el.findtext(path) or '').strip()
def num(text):
    return None if text is None or not str(text).strip() else float(text)
def coordinates(lat,lon):
    lat,lon=num(lat),num(lon)
    if lat is None or lon is None or (lat==0 and lon==0) or not (-90<=lat<=90 and -180<=lon<=180):return None
    return [lat,lon]
def save(records,sources,extra=None):
    keys=[r['id'] for r in records]
    if not records or len(keys)!=len(set(keys)):raise ValueError('Empty edition or duplicate record keys')
    directory=ROOT/'data'
    directory.mkdir(exist_ok=True)
    status={'retrieved':datetime.now(timezone.utc).date().isoformat(),'count':len(records),
            'mapped':sum(bool(r.get('geo')) for r in records),'sources':sources,**(extra or {})}
    parts={}
    for r in records:parts.setdefault(r['group'],[]).append(r)
    status['groups']=sorted(parts)
    with TemporaryDirectory(dir=directory) as temp:
        stage=Path(temp)
        for key,rows in parts.items():
            payload=json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()
            (stage/(key+'.json.gz')).write_bytes(gzip.compress(payload,compresslevel=9,mtime=0))
        (stage/'status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
        for item in stage.iterdir():item.replace(directory/item.name)
    print('Validated',len(keys),'records;',status['mapped'],'mapped.')
def expand(source_dir, stage):
    d=stage/'data';d.mkdir()
    s=json.loads((source_dir/'status.json').read_text())
    for group in s['groups']:
        (d/(group+'.json')).write_bytes(gzip.decompress((source_dir/(group+'.json.gz')).read_bytes()))
    (d/'status.json').write_bytes((source_dir/'status.json').read_bytes())
