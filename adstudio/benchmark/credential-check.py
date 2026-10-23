"""Opt-in GET-only check. Never proves DELETE permission or personal identity."""
import argparse, base64, getpass, hashlib, os, pathlib
from lifecycle import request, amount

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--check-read-only',action='store_true')
    parser.add_argument('--billing-only',action='store_true')
    parser.add_argument('--public-key',required=False)
    args=parser.parse_args()
    if not args.check_read_only:
        print('DRY RUN: credential check needs --check-read-only; no requests.');return
    if args.billing_only:
        if not os.environ.get('RUNPOD_API_KEY'):
            os.environ['RUNPOD_API_KEY']=getpass.getpass('Temporary read-only billing key (hidden): ')
        status,billing=request('/billing?lastN=1&bucketSize=month')
        if status!=200:raise RuntimeError('Billing read failed')
        total=amount(billing['metadata']['totals']['totalAmount'])
        if total!=0:raise RuntimeError('Nonzero current-month billing; reconcile allocation before deployment')
        print('PASS GET-only billing authentication/current-month zero spend; confirm same account privately in console.');return
    if not args.public_key:raise ValueError('Dedicated .pub path required; never pass a private key')
    path=pathlib.Path(args.public_key)
    if path.suffix!='.pub':raise ValueError('Only .pub public-key files accepted')
    parts=path.read_text().split()
    if len(parts)<2 or parts[0]!='ssh-ed25519':raise ValueError('Expected dedicated ED25519 public key')
    expected=parts[:2]
    if not os.environ.get('RUNPOD_API_KEY'):
        os.environ['RUNPOD_API_KEY']=getpass.getpass('Temporary Runpod API key (hidden): ')
    status,keys=request('/account/ssh-keys')
    if status!=200 or not any(k.split()[:2]==expected for k in keys['keys']):raise RuntimeError('Dedicated public key does not match credential account')
    status,pods=request('/pods?includeClusterPods=true&limit=1000')
    if status!=200 or not isinstance(pods.get('pods'),list) or pods['pagination']['hasNextPage'] or pods['pods']:
        raise RuntimeError('Expected complete empty Pod inventory before first experiment')
    fingerprint='SHA256:'+base64.b64encode(hashlib.sha256(base64.b64decode(expected[1],validate=True)).digest()).decode().rstrip('=')
    print('PASS GET-only authentication, matching dedicated public key:',fingerprint)
    print('Empty Pod inventory verified. DELETE scope, billing, balance and console identity remain separately required.')

if __name__=='__main__':main()
