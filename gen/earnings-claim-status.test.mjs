import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isDead, isTaggedFor, loadStore } from "./store.mjs";

// The Earnings claim strings (support inbox 8126). The SDK reports an epoch
// the vault finalized without a payout root as "not-finalized", and the site
// read that as "Finalizing" and windows as "Not finalized"; every app now
// labels it sn_status_not_finalized, "No payout published". The count under
// the unclaimed total counts claimable epochs, so it says claimable, not
// finalized. Five apps code against these ids and texts, and apple looks a
// string up by its English.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const APPS = ["android", "apple", "windows", "linux", "site"];

const signature = (k) => k.placeholders.map((p) => `${p.name}:${p.type}`).join(" ");

test("the count under the unclaimed total says claimable epochs", () => {
	const k = keys.get("claim_across_epochs");
	assert.equal(k.localizations.en, "Claimable epochs: {count}");
	assert.equal(k.source, "Claimable epochs: %lld", "source is the literal apple looks up");
	assert.equal(signature(k), "count:int");
	assert.ok(!k.plurals, "the count follows its label, so no plural key");
});

test("an epoch finalized without a payout reads No payout published", () => {
	const k = keys.get("sn_status_not_finalized");
	assert.equal(k.localizations.en, "No payout published");
	assert.equal(k.source, "No payout published", "source is the literal apple looks up");
	assert.equal(signature(k), "");
});

test("the claim strings are tagged for every app and translated into every store locale", () => {
	for (const id of ["claim_across_epochs", "sn_status_not_finalized"]) {
		const k = keys.get(id);
		for (const p of APPS) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
		assert.deepEqual(LOCALES.filter((l) => k.localizations[l] == null), [], `${id} locales`);
		const english = LOCALES.filter((l) => l !== "en" && k.localizations[l] === k.localizations.en);
		assert.deepEqual(english, [], `${id} is translated`);
	}
});

test("the site no longer says Finalizing for an epoch", () => {
	const k = keys.get("site_app_epoch_finalizing");
	assert.equal(isTaggedFor(k, "site"), false);
	assert.ok(isDead(k));
});
