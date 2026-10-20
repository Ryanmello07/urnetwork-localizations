// The duration replaces one Android boolean; old translations remain retired
// store history rather than a second live gate.
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

import { ROOT, LOCALES, ANDROID_LOCALE_DIR, loadStore, isDead, requiredLocales } from "./store.mjs";

test("affinity duration keys are live Android UI in all required locales", () => {
	const keys = new Map(loadStore().map((key) => [key.id, key]));
	for (const name of ["dev_affinity_max_time", "dev_affinity_max_time_detail", "dev_group_follow_compat_detail"]) {
		const key = keys.get(name);
		assert.ok(key, name);
		assert.deepEqual(key.platforms, ["android"]);
		assert.equal(isDead(key), false);
		assert.equal(key.translatable, true);
		assert.deepEqual(requiredLocales(key), LOCALES);
		assert.deepEqual(Object.keys(key.localizations).sort(), [...LOCALES].sort());
		for (const locale of LOCALES) assert.ok(key.localizations[locale].trim(), name + ":" + locale);
	}
	const detail = keys.get("dev_affinity_max_time_detail").localizations.en;
	for (const premise of ["healthy", "original connection", "since creation", "1 minute", "Zero or negative", "Warned or unhealthy", "explicit pins"])
		assert.ok(detail.includes(premise), premise);
	const compatibility = keys.get("dev_group_follow_compat_detail").localizations.en;
	assert.ok(compatibility.includes("not a health override"));
	assert.ok(compatibility.includes("never reuse warned or unhealthy exits"));
});

test("retired affinity boolean keys retain every translation without a live platform", () => {
	const keys = new Map(loadStore().map((key) => [key.id, key]));
	for (const name of ["dev_fresh_flow_affinity", "dev_fresh_flow_affinity_detail"]) {
		const key = keys.get(name);
		assert.ok(key, name);
		assert.deepEqual(key.platforms, []);
		assert.ok(key.deprecated.includes("android"));
		assert.equal(isDead(key), true);
		assert.deepEqual(Object.keys(key.localizations).sort(), [...LOCALES].sort());
	}
	const shared = keys.get("dev_group_follow_detail");
	assert.deepEqual(shared.platforms, ["apple"]);
	assert.ok(shared.deprecated.includes("android"));
	assert.equal(isDead(shared), false);
	const androidOnly = keys.get("dev_group_follow_window_detail");
	assert.deepEqual(androidOnly.platforms, []);
	assert.ok(androidOnly.deprecated.includes("android"));
	assert.equal(isDead(androidOnly), true);
});

test("generated Android catalogs expose only the new duration keys", () => {
	for (const directory of Object.values(ANDROID_LOCALE_DIR)) {
		const xml = fs.readFileSync(path.join(ROOT, "android/app/app/src/main/res", directory, "strings.xml"), "utf8");
		for (const name of ["dev_affinity_max_time", "dev_affinity_max_time_detail", "dev_group_follow_compat_detail"])
			assert.equal(xml.split('name="' + name + '"').length - 1, 1, directory + ":" + name);
		for (const name of ["dev_fresh_flow_affinity", "dev_fresh_flow_affinity_detail", "dev_group_follow_detail", "dev_group_follow_window_detail"])
			assert.equal(xml.includes('name="' + name + '"'), false, directory + ":" + name);
	}
});
