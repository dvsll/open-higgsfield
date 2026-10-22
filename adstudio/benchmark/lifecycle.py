"""Two independently hosted watchdogs use the SAME lease/deadline.
No provisioning endpoint exists here. Default is offline dry run.
"""
import argparse, datetime, json, math, os, pathlib, re, sys, time, urllib.error, urllib.parse, urllib.request
BASE='https://rest.runpod.io/v1'
def validate_lease(p, now=None):
    now=time.time() if now is None else now
    valid=(p['version']==1 and isinstance(p['podId'],str) and re.fullmatch(r'[a-zA-Z0-9_-]+',p['podId'])
           and p['name'].startswith('adstudio-ltx25-')
           and all(isinstance(p[k],(int,float)) and not isinstance(p[k],bool) and math.isfinite(p[k]) for k in ['created','deadline','gpuRate','storageHourly','sessionCap'])
           and 0 < p['deadline']-p['created'] <= 10800 and 0 < p['created'] <= now+30
           and 0 < p['gpuRate'] <= 1.79 and 0 <= p['storageHourly'] <= .04 and 0 < p['sessionCap'] <= 6
           and p['networkVolumeId'] is None)
    if not valid: raise ValueError('Invalid lease/budget bounds')
    return p

def require_armed(p, path, now=None):
    now=time.time() if now is None else now
    validate_lease(p,now)
    proof=json.loads(pathlib.Path(path).read_text())
    if expired(p,now) or any(proof.get(k)!=p[k] for k in ['podId','created','deadline']) or proof.get('state')!='armed' or not 0<=now-proof.get('checked',0)<=45:
        raise RuntimeError('No fresh authenticated watchdog heartbeat for this lease; stop before setup/download/upload')
    return True

def write_ready(p,path):
    if not path:return
    target=pathlib.Path(path);target.parent.mkdir(parents=True,exist_ok=True)
    temp=target.with_suffix(target.suffix+f'.{os.getpid()}.tmp')
    temp.write_text(json.dumps({k:p[k] for k in ['podId','created','deadline']}|{'state':'armed','checked':time.time()}))
    temp.replace(target)
def request(path,method='GET'):
    req=urllib.request.Request(BASE+path,method=method,headers={'Authorization':'Bearer '+os.environ['RUNPOD_API_KEY']})
    try:
        with urllib.request.urlopen(req,timeout=10) as r:
            raw=r.read(); return r.status,json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        if e.code==404: return 404,None
        raise RuntimeError(f'Runpod {method}: HTTP {e.code}') from None
def expired(p,now):
    # Begin termination 5min early, reserving time for control-plane retries.
    elapsed=max(0,now-p['created'])
    return now>=p['deadline']-300 or elapsed/3600*(p['gpuRate']+p['storageHourly'])>=p['sessionCap']-.20
def terminate(p):
    status,pod=request('/pods/'+p['podId'])
    if status==404:return True
    if pod.get('name')!=p['name']:raise RuntimeError('Pod identity mismatch; manual intervention required')
    status,_=request('/pods/'+p['podId'],'DELETE')
    if status not in (200,202,204,404):raise RuntimeError('Termination not acknowledged')
    status,_=request('/pods/'+p['podId'])
    return status==404

def terminate_until_gone(p):
    # Never report deletion as successful until the provider confirms absence.
    while True:
        try:
            if terminate(p):print('Termination verified: GET Pod returned404',flush=True);return
        except Exception as e:print('TERMINATION NOT VERIFIED:',type(e).__name__,'check console now',flush=True)
        time.sleep(10)
def audit(p,folder):
    folder.mkdir(parents=True,exist_ok=True)
    status,_=request('/pods/'+p['podId'])
    start=datetime.datetime.fromtimestamp(p['created'],datetime.timezone.utc).isoformat()
    end=datetime.datetime.now(datetime.timezone.utc).isoformat()
    query=urllib.parse.urlencode({'startTime':start,'endTime':end,'bucketSize':'hour'})
    billing=request('/billing/pods?'+query)[1]
    volumes=request('/networkvolumes')[1]
    rows=[r for r in billing if r.get('podId')==p['podId']]
    summary={'checked':end,'podId':p['podId'],'podAbsent':status==404,'billingRows':rows,'reportedCost':sum(float(r.get('amount',0)) for r in rows),'networkVolumes':volumes,'billingFinal':False,'note':'Billing can lag. Recheck console and history after meter catches up; absence is not proof of final settled spend.'}
    (folder/'billing-audit.json').write_text(json.dumps(summary,indent=2))
    print('Pod absent:',summary['podAbsent'],'reported session cost:',summary['reportedCost'],'(may lag); private audit saved')
    if status!=404:raise RuntimeError('Pod still exists: termination not verified')
def main():
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['watch','terminate','audit','verify-ready']);parser.add_argument('--lease',required=True);parser.add_argument('--approved',action='store_true');parser.add_argument('--out',default='outputs/ltx25-benchmark/lifecycle');parser.add_argument('--ready-file')
    args=parser.parse_args();p=validate_lease(json.loads(pathlib.Path(args.lease).read_text()))
    if not args.approved:print('DRY RUN:',args.action,'for named lease; no API calls. Requires explicit user approval.');return
    if args.action=='verify-ready':require_armed(p,args.ready_file);print('Fresh authenticated watchdog heartbeat verified');return
    if args.action=='audit':audit(p,pathlib.Path(args.out));return
    if args.action=='watch':
        while True:
            try: status,pod=request('/pods/'+p['podId']); break
            except Exception:
                print('Watchdog cannot verify Pod; check console. Retrying.',flush=True)
                time.sleep(5)
        if status==404:return
        if pod.get('name')!=p['name']:raise RuntimeError('Pod identity mismatch')
        # A live quote must match the approved price. Refuse to wait at a higher rate.
        rate=pod.get('costPerHr')
        try: rate_ok=rate is not None and math.isfinite(float(rate)) and 0<float(rate)<=p['gpuRate']+p['storageHourly']
        except (TypeError,ValueError): rate_ok=False
        if not rate_ok:
            print('Unknown/higher live rate: terminating immediately',flush=True)
        else:
            print('Watchdog armed; termination begins at',p['deadline']-300,flush=True)
            try:
                while not expired(p,time.time()):
                    try:
                        current,live=request('/pods/'+p['podId'])
                        if current==404:return
                        if live.get('name')!=p['name']:raise RuntimeError('Pod identity mismatch')
                        live_rate=float(live.get('costPerHr',float('inf')))
                        if not math.isfinite(live_rate) or not 0<live_rate<=p['gpuRate']+p['storageHourly']:break
                    except Exception:
                        print('Watchdog authentication/rate check unavailable; not refreshing readiness.',flush=True)
                        time.sleep(5)
                        continue
                    try:write_ready(p,args.ready_file)
                    except OSError:print('Cannot publish heartbeat; watchdog deadline remains active. Workers must stop.',flush=True)
                    time.sleep(min(15,max(0,p['deadline']-300-time.time())))
            except KeyboardInterrupt:print('Interrupted: terminating now',flush=True)
    # Retry beyond the deadline until deletion is actually verified; never claim
    # a hard provider guarantee when its control plane is unreachable.
    terminate_until_gone(p)
if __name__=='__main__':main()
