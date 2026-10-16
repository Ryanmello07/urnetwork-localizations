import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "./generate.mjs";
import { APPLE_LOCALE, ROOT } from "./store.mjs";

// The menu bar's catalog-only Connecting… row was removed by the next build:
// its store key existed for the site, but was not tagged for Apple. Exercise
// generation from the store, not just the already generated app catalog.
const catalogPath = "apple/app/network/Shared/Resources/Localizable.xcstrings";
const previousTranslations = JSON.parse(fs.readFileSync(
	new URL("./fixtures/apple-connecting-translations.json", import.meta.url), "utf8",
));

function menuBarLookup() {
	const source = fs.readFileSync(path.join(ROOT, "apple/app/network/NetworkApp.swift"), "utf8");
	const match = source.match(/case \.connecting:\s*return String\(localized: ("(?:\\.|[^"\\])*")\)/);
	assert.ok(match, "the connecting menu status uses a localized string");
	return JSON.parse(match[1]);
}

function assertConnectingTranslations(catalog, lookup) {
	const entry = JSON.parse(catalog).strings[lookup];
	assert.ok(entry, `${lookup} survives regeneration from the canonical store`);
	assert.notEqual(entry.extractionState, "stale");
	assert.deepEqual(Object.keys(previousTranslations).sort(), Object.values(APPLE_LOCALE).sort());
	for (const [locale, value] of Object.entries(previousTranslations)) {
		assert.deepEqual(entry.localizations[locale]?.stringUnit, {
			state: "translated", value,
		}, `${locale} preserves the menu bar's existing translation`);
	}
}

test("the live menu bar lookup is generated with every existing translation", () => {
	assertConnectingTranslations(build(["apple"])[catalogPath], menuBarLookup());
});

test("the generator retains the menu bar lookup across repeated catalog replacement", (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ur-menu-bar-localizations-"));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const file = path.join(root, catalogPath);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const lookup = menuBarLookup();
	const localizations = Object.fromEntries(Object.entries(previousTranslations)
		.map(([locale, value]) => [locale, { stringUnit: { state: "translated", value } }]));
	fs.writeFileSync(file, JSON.stringify({ strings: { [lookup]: { localizations } } }));
	const generate = (...args) => execFileSync(process.execPath, [
		fileURLToPath(new URL("./generate.mjs", import.meta.url)), "apple", ...args,
	], { env: { ...process.env, URNETWORK_ROOT: root }, encoding: "utf8" });
	generate();
	const first = fs.readFileSync(file, "utf8");
	assertConnectingTranslations(first, lookup);
	generate();
	assert.equal(fs.readFileSync(file, "utf8"), first);
	generate("--check");
});
