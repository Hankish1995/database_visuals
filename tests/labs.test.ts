import { test } from "node:test";
import assert from "node:assert/strict";
import { LABS } from "@/content/labs";
import { crashAndRecover } from "@/lib/db/crash";
import { openSeeded } from "@/lib/db/openSeeded";
import { runScript } from "@/lib/db/runScript";

// Each lab lesson, step by step, against real PostgreSQL -- including the crash.
for (const lab of Object.values(LABS)) {
  test(`lab "${lab.id}" runs every step as described`, async () => {
    let db = await openSeeded({ key: `lab-${lab.id}`, sql: lab.setup, extensions: lab.extensions });
    for (const step of lab.steps) {
      if (step.action === "crash") {
        const { db: recovered, report } = await crashAndRecover(db, lab.extensions);
        db = recovered;
        assert.notEqual(report.redoAfter, report.redoBefore, `${step.id}: recovery should end with a new checkpoint`);
        assert.ok(report.replayed.length > 0, `${step.id}: some WAL should have been replayed`);
        continue;
      }
      const results = await runScript(db, step.sql, { continueOnError: true });
      const errors = results.filter((r) => r.error).map((r) => `${r.sql.slice(0, 50)} -> ${r.error!.message}`);
      assert.equal(errors.length, step.expectedErrors ?? 0, `${lab.id}/${step.id}: ${errors.join(" | ")}`);
    }
    await db.close();
  });
}
