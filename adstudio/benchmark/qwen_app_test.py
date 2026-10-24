"""CPU-only mocked lifecycle tests. Never contacts Runpod or uploads assets."""
import hashlib,importlib.util,json,pathlib,tempfile,time,unittest
from unittest.mock import patch
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
m=module('monitor','qwen-app-monitor.py');prep=module('prepare','qwen-app-prepare.py');ssh=module('sshhelper','qwen-app-ssh.py')
class AppTests(unittest.TestCase):
 def test_startup_failure_signals_cleanup_without_upload(self):
  import sys
  with tempfile.TemporaryDirectory() as tmp:
   out=pathlib.Path(tmp);(out/'lease.json').write_text(json.dumps({'podId':'MOCK'}));(out/'acceptance.json').write_text(json.dumps({'paidApproved':False}))
   with patch.object(ssh.q,'connection',return_value=({'host':'MOCK','port':22},[])),patch.object(ssh.q.g,'OUT',out),patch.object(sys,'argv',['qwen-app-ssh.py','--approved']),patch.object(ssh.subprocess,'run') as run:
    with self.assertRaises(ValueError):ssh.main()
    run.assert_not_called();self.assertEqual(json.loads((out/'one-job.json.status.json').read_text())['state'],'failed')
 def test_verified_collection_and_original_preservation(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=pathlib.Path(tmp);out=root/'outputs';out.mkdir();files=[]
   for name in ['comfy-output.png','reference.png','original.jpg','provenance.json','aaaaaaaaaaaaaaaa.png']:
    path=out/name;path.write_bytes(name.encode());files.append({'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
   lease={'podId':'MOCK'};record={'state':'collected','podId':'MOCK','jobId':'MOCK-JOB','files':files}
   self.assertTrue(m.verify_collection(record,lease,root))
   (out/'original.jpg').write_bytes(b'changed')
   with self.assertRaises(ValueError):m.verify_collection(record,lease,root)
 def test_finally_exact_termination_on_success_failure_and_budget(self):
  for state in ['collected','failed','budget']:
   with self.subTest(state=state),tempfile.TemporaryDirectory() as tmp:
    out=pathlib.Path(tmp);p={'podId':'MOCK','created':time.time()-100,'deadline':time.time()+7000}
    if state!='budget':(out/'one-job.json.status.json').write_text(json.dumps({'state':state}))
    else:p['deadline']=time.time()+10
    with patch.object(m.g,'OUT',out),patch.object(m.g,'request',return_value=(200,{})),patch.object(m.g,'check'),patch.object(m.g,'terminate') as kill,patch.object(m,'verify_collection',return_value=True):
     if state=='collected':m.monitor(p)
     else:
      with self.assertRaises(RuntimeError):m.monitor(p)
     kill.assert_called_once_with(p)
 def test_prepare_remains_unapproved_and_origin_bound(self):
  with tempfile.TemporaryDirectory() as tmp:
   out=pathlib.Path(tmp);d={'reviewedSnapshot':'MOCK only','promptFormat':'concise-v2','modelPrompt':'Reviewed','input':{'source':{'sha256':'a'*64,'originalSha256':'b'*64}}}
   settings={'imageModel':'qwen-fp8','seed':42,'sourceKind':'original','brandId':'brand','sourceId':'ref','prompt':'Reviewed'}
   path=out/'brief.json';path.write_text(json.dumps({'project':{'id':'MOCK-project'},'draft':d,'payload':{'settings':settings}}))
   with patch.object(prep.subprocess,'check_output',return_value='c'*40):prep.bind(path,'http://127.0.0.1:8301',out)
   plan=json.loads((out/'acceptance.json').read_text());self.assertFalse(plan['paidApproved']);self.assertFalse(plan['privateUploadApproved']);self.assertEqual(plan['maxJobs'],1);self.assertEqual(plan['browserOrigin'],'http://127.0.0.1:8301')
   with self.assertRaises(ValueError):prep.bind(path,'https://public.example',out)
 def test_public_bundle_excludes_private_and_uncommitted_files(self):
  import io,tarfile
  with tempfile.TemporaryDirectory() as tmp:
   raw=io.BytesIO()
   with tarfile.open(fileobj=raw,mode='w') as t:
    for name in [*prep.REQUIRED,'shared/runtime/api.ts','.env','outputs/private.jpg','adstudio/src/private.ts']:
     item=tarfile.TarInfo(name);item.size=4;t.addfile(item,io.BytesIO(b'TEST'))
   with patch.object(prep.subprocess,'check_output',side_effect=['a'*40,raw.getvalue()]):prep.bundle(pathlib.Path(tmp))
   with tarfile.open(pathlib.Path(tmp)/'public-app.tar') as t:
    self.assertNotIn('.env',t.getnames());self.assertNotIn('outputs/private.jpg',t.getnames());self.assertNotIn('adstudio/src/private.ts',t.getnames())
if __name__=='__main__':unittest.main()
