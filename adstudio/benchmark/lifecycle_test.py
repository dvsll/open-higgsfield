import importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('lifecycle',pathlib.Path(__file__).with_name('lifecycle.py'))
life=importlib.util.module_from_spec(spec);spec.loader.exec_module(life)
class LifecycleTests(unittest.TestCase):
    def setUp(self): self.lease={'version':1,'podId':'test-pod','name':'adstudio-ltx25-test','created':1000,'deadline':11800,'gpuRate':1.79,'storageHourly':.032,'sessionCap':6,'networkVolumeId':None}
    def test_bounds(self):
        self.assertEqual(life.validate_lease(self.lease,1100),self.lease)
        for field,value in [('deadline',12000),('gpuRate',2),('sessionCap',10),('networkVolumeId','volume'),('podId','../other')]:
            with self.subTest(field=field), self.assertRaises((ValueError,KeyError)): life.validate_lease({**self.lease,field:value},1100)
    def test_watchdog_heartbeat_required(self):
        base=pathlib.Path('outputs/benchmark-preflight-20261022').resolve();base.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(dir=base) as folder:
            file=pathlib.Path(folder)/'ready.json'
            with self.assertRaises(FileNotFoundError):life.require_armed(self.lease,file,1100)
            proof={k:self.lease[k] for k in ['podId','created','deadline']}|{'state':'armed','checked':1090}
            file.write_text(json.dumps(proof));self.assertTrue(life.require_armed(self.lease,file,1100))
            for bad in [{**proof,'checked':1000},{**proof,'podId':'other'},{**proof,'state':'starting'}]:
                file.write_text(json.dumps(bad))
                with self.assertRaises(RuntimeError):life.require_armed(self.lease,file,1100)
    def test_early_termination(self):
        self.assertFalse(life.expired(self.lease,1100))
        self.assertTrue(life.expired(self.lease,11500))
    def test_termination_verified(self):
        with patch.object(life,'request',side_effect=[(200,{'name':self.lease['name']}),(204,None),(404,None)]) as req:
            self.assertTrue(life.terminate(self.lease));self.assertEqual(req.call_args_list[1].args,('/pods/test-pod','DELETE'))
    def test_wrong_resource_never_deleted(self):
        with patch.object(life,'request',return_value=(200,{'name':'other-project'})) as req:
            with self.assertRaises(RuntimeError):life.terminate(self.lease)
            self.assertEqual(req.call_count,1)
    def test_absent_idempotent(self):
        with patch.object(life,'request',return_value=(404,None)) as req:
            self.assertTrue(life.terminate(self.lease));self.assertEqual(req.call_count,1)
if __name__=='__main__':unittest.main()
