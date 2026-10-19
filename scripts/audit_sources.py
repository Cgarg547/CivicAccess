#!/usr/bin/env python3
"""Read-only inventory of local geospatial sources; never modifies raw data."""
import argparse, csv, hashlib, json
from pathlib import Path

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--data',type=Path,required=True,help='Directory of uploaded source files')
    ap.add_argument('--output',type=Path,default=Path('data/processed/source_manifest.csv'))
    args=ap.parse_args()
    if not args.data.is_dir(): ap.error('Data directory does not exist')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    rows=[]
    for p in sorted(args.data.iterdir()):
        if not p.is_file(): continue
        sha=hashlib.sha256()
        with p.open('rb') as f:
            for chunk in iter(lambda:f.read(1024*1024),b''): sha.update(chunk)
        rows.append({'filename':p.name,'extension':p.suffix.lower(),'bytes':p.stat().st_size,'sha256':sha.hexdigest(),'source_url':'','retrieved_date':'','license':'','dataset_role':'unclassified','review_status':'pending'})
    with args.output.open('w',newline='',encoding='utf-8') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]) if rows else ['filename','extension','bytes','sha256','source_url','retrieved_date','license','dataset_role','review_status']);writer.writeheader();writer.writerows(rows)
    print(f'Indexed {len(rows)} files → {args.output}')
if __name__=='__main__':main()
