#!/usr/bin/env python3
"""Read-only official directory discovery. Never verifies or publishes course facts."""
import argparse, concurrent.futures, datetime, hashlib, html, json, subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
class DirectoryParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title = ''; self.in_title = False; self.links = []; self.href = None; self.label = ''
    def handle_starttag(self, tag, attrs):
        if tag == 'title': self.in_title = True
        if tag == 'a': self.href = dict(attrs).get('href'); self.label = ''
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.href: self.label += data
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'a' and self.href:
            self.links.append((self.href, ' '.join(self.label.split()))); self.href = None

def collect(row):
    out = {**row, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'verificationStatus': 'NEEDS_REVIEW', 'publicationStatus': 'draft'}
    p = subprocess.run(['curl','--silent','--show-error','--location','--max-redirs','4','--proto','=https','--proto-redir','=https','--max-time','35','--max-filesize','5000000','--user-agent','ALOEducation-OfficialSourceAudit/1.0','--write-out','\n%{http_code}\n%{url_effective}',row['url']],capture_output=True,text=True)
    if p.returncode: return {**out, 'fetchStatus':'FETCH_FAILED','reason':p.stderr.strip()[:300]}
    body,status,final = p.stdout.rsplit('\n',2); parser=DirectoryParser(); parser.feed(body)
    source_host=urlparse(row['url']).hostname.removeprefix('www.'); final_host=urlparse(final).hostname.removeprefix('www.')
    same_domain=final_host == source_host or final_host.endswith('.'+source_host)
    links={urljoin(final,href):label for href,label in parser.links if urlparse(urljoin(final,href)).scheme=='https' and urlparse(urljoin(final,href)).hostname == urlparse(final).hostname and any(word in (href+' '+label).lower() for word in ['course','program','degree','master','bachelor'])}
    return {**out,'fetchStatus':'FETCHED_NOT_VERIFIED' if status=='200' and same_domain else 'HTTP_OR_DOMAIN_REVIEW','httpStatus':int(status),'finalUrl':final,'sameRegisteredHost':same_domain,'pageTitle':html.unescape(parser.title.strip()),'contentSha256':hashlib.sha256(body.encode()).hexdigest(),'candidateLinks':[{'url':url,'label':label,'status':'DISCOVERED_ONLY'} for url,label in sorted(links.items())],'note':'Directory candidates only. No parsed fees, intake, eligibility, rankings or official partnership claims. HTTP 200 does not establish entity verification.'}

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--out',required=True); args=parser.parse_args()
    registry=Path(__file__).resolve().parents[1]/'data/official-sources/destination-registry.json'
    rows=json.loads(registry.read_text()); results=list(concurrent.futures.ThreadPoolExecutor(max_workers=3).map(collect,rows))
    target=Path(args.out); target.parent.mkdir(parents=True,exist_ok=True); target.write_text(json.dumps({'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'One initial official directory per destination; not a complete national or international catalog','databaseWrites':False,'sources':results},indent=2)+'\n')
    print(json.dumps({'sources':len(results),'fetched':sum(x['fetchStatus']=='FETCHED_NOT_VERIFIED' for x in results),'candidates':sum(len(x.get('candidateLinks',[])) for x in results),'output':str(target)}))
if __name__=='__main__': main()
