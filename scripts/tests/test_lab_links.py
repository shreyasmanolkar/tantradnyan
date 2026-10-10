"""Installed npm documentation must not contaminate authored-link validation."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('lab', Path(__file__).parents[1] / 'lab.py')
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class LocalLinksTests(unittest.TestCase):
    def test_skips_installed_docs_but_keeps_authored_failures(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            installed = root / 'domains' / 'iam' / 'node_modules' / 'package'
            installed.mkdir(parents=True)
            (installed / 'README.md').write_text('[missing upstream](missing.md)')
            authored = root / 'domains' / 'iam' / 'README.md'
            authored.write_text('[missing authored](missing.md)')
            with patch.object(lab, 'ROOT', root):
                errors = lab.local_links()
            self.assertEqual(len(errors), 1)
            self.assertIn('domains/iam/README.md', errors[0])


if __name__ == '__main__':
    unittest.main()
