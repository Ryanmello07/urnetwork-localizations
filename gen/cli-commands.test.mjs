import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";

// Strings that tell users which CLI command to run must name a command that
// exists. The sn provider CLI dropped `provider bind-head` / `snclaim bind-head`
// (and unbind-head); head binding is `provider fleet bind` now.
const RETIRED_COMMANDS = [/\bbind-head\b/, /\bunbind-head\b/];

function texts(key) {
	const out = [["source", key.source]];
	for (const [locale, value] of Object.entries(key.localizations || {})) out.push([locale, value]);
	for (const [locale, forms] of Object.entries(key.plurals?.forms || {})) {
		for (const [form, value] of Object.entries(forms)) out.push([`${locale}.${form}`, value]);
	}
	return out.filter(([, value]) => typeof value === "string");
}

test("no string names a retired sn CLI command", () => {
	const hits = [];
	for (const [id, key] of Object.entries(loadAllKeys({ platform: null }))) {
		for (const [where, value] of texts(key)) {
			if (RETIRED_COMMANDS.some((pattern) => pattern.test(value))) hits.push(`${id} ${where}: ${value}`);
		}
	}
	assert.deepEqual(hits, []);
});

test("every locale of the Top 200 binding steps names provider fleet bind", () => {
	const all = loadAllKeys({ platform: null });
	for (const id of ["site_app_top200_step_bind", "site_app_top200_hotkey_sign_hint"]) {
		for (const [where, value] of texts(all[id])) {
			assert.match(value, /provider fleet bind/, `${id} ${where}`);
		}
	}
});
