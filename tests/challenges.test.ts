import { test } from "node:test";
import assert from "node:assert/strict";
import { CHALLENGES } from "@/content/challenges";
import { checkChallenge } from "@/lib/db/checkChallenge";
import { SHOP_SEED } from "@/lib/db/seeds";

const SHOP = { key: "shop", sql: SHOP_SEED };

for (const c of CHALLENGES) {
  test(`challenge "${c.id}": the solution passes and the starter doesn't`, async () => {
    const solved = await checkChallenge(c, c.solution, SHOP);
    assert.equal(solved.passed, true, `solution: ${solved.message}`);
    const starter = await checkChallenge(c, c.starter, SHOP);
    assert.equal(starter.passed, false, "starter should not pass");
  });
}

test("a wrong answer is explained", async () => {
  const c = CHALLENGES.find((x) => x.id === "hardware-prices")!;
  const wrongOrder = await checkChallenge(c, "SELECT name, price FROM products WHERE category = 'hardware' ORDER BY price DESC;", SHOP);
  assert.equal(wrongOrder.message, "Right rows, wrong order.");
  const trigger = CHALLENGES.find((x) => x.id === "price-history")!;
  const noFilter = await checkChallenge(trigger, trigger.solution.replace(" WHEN (OLD.price IS DISTINCT FROM NEW.price)", ""), SHOP);
  assert.equal(noFilter.passed, false, "a trigger that also logs stock-only updates must fail");
});
