"""A real local SQLite transaction couples a receipt and a side effect."""
import sqlite3
import tempfile
from pathlib import Path


class Ledger:
    def __init__(self, path):
        self.db = sqlite3.connect(path, isolation_level=None)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, amount INTEGER NOT NULL)")
        self.db.execute("CREATE TABLE IF NOT EXISTS balance(id INTEGER PRIMARY KEY, amount INTEGER NOT NULL)")
        self.db.execute("INSERT OR IGNORE INTO balance VALUES(1, 0)")

    def accept(self, identifier, amount, fail_before_commit=False):
        self.db.execute("BEGIN IMMEDIATE")
        try:
            old = self.db.execute("SELECT amount FROM receipts WHERE id=?", (identifier,)).fetchone()
            if old:
                if old[0] != amount:
                    raise ValueError("id reused with another amount")
                result = "duplicate"
            else:
                self.db.execute("INSERT INTO receipts VALUES(?, ?)", (identifier, amount))
                self.db.execute("UPDATE balance SET amount=amount+? WHERE id=1", (amount,))
                result = "committed"
            if fail_before_commit:
                raise RuntimeError("injected failure before commit")
            self.db.execute("COMMIT")
            return result
        except Exception:
            self.db.execute("ROLLBACK")
            raise

    def total(self):
        return self.db.execute("SELECT amount FROM balance WHERE id=1").fetchone()[0]

    def snapshot(self, destination):
        with sqlite3.connect(destination) as target:
            self.db.backup(target)

    def close(self):
        self.db.close()


def demo():
    with tempfile.TemporaryDirectory() as folder:
        path, backup = Path(folder) / "ledger.db", Path(folder) / "backup.db"
        ledger = Ledger(path)
        first = ledger.accept("job-1", 7)
        duplicate = ledger.accept("job-1", 7)
        try:
            ledger.accept("job-2", 9, fail_before_commit=True)
        except RuntimeError:
            pass
        ledger.snapshot(backup)
        ledger.accept("job-3", 2)
        total = ledger.total()
        ledger.close()
        restored = Ledger(backup)
        restored_total = restored.total()
        restored.close()
        return {"first": first, "retry": duplicate, "live_total": total, "restored_total": restored_total}
