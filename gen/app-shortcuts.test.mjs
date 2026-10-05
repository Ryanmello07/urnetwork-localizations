// The App Shortcuts phrases (keys with `table: AppShortcuts`): Siri matches a
// spoken request against them to run Shortcuts.swift's connect and disconnect
// shortcuts, in the language Siri speaks. A language a phrase lacks falls back
// to English, which no one says to a Siri set to that language, and two
// phrases that read alike in a language make Siri pick one of two intents.
import assert from "node:assert/strict";
import test from "node:test";

import { build } from "./generate.mjs";
import {
	APPLE_LOCALE, APPLICATION_NAME, SIRI_LOCALES, appleTable, collate, isAppleTableOnly, loadStore,
} from "./store.mjs";

const phrases = loadStore().filter((k) => k.table === "AppShortcuts");

test("a key names its apple table, Localizable by default", () => {
	assert.equal(appleTable({ id: "k" }), "Localizable");
	assert.equal(appleTable({ id: "k", table: "AppShortcuts" }), "AppShortcuts");
	assert.equal(isAppleTableOnly({ id: "k" }), false);
	assert.equal(isAppleTableOnly({ id: "k", table: "AppShortcuts" }), true);
});

test("every App Shortcuts phrase is in exactly the languages Siri speaks", () => {
	assert.ok(phrases.length >= 14, `${phrases.length} App Shortcuts phrases`);
	const wrong = [];
	for (const k of phrases) {
		const locales = Object.keys(k.localizations).sort();
		if (locales.join() !== [...SIRI_LOCALES].sort().join())
			wrong.push(`${k.id}: ${locales.join(" ")}`);
	}
	assert.deepEqual(wrong, []);
});

test("every App Shortcuts phrase carries the app's name once", () => {
	const wrong = [];
	for (const k of phrases)
		for (const [loc, v] of Object.entries({ source: k.source, ...k.localizations }))
			if (v.split(APPLICATION_NAME).length !== 2) wrong.push(`${k.id}[${loc}]: ${v}`);
	assert.deepEqual(wrong, []);
});

test("no two App Shortcuts phrases of a language read alike", () => {
	const wrong = [];
	for (const loc of SIRI_LOCALES) {
		const seen = new Map();
		for (const k of phrases) {
			// Siri matches the words, not their case or spacing
			const said = k.localizations[loc].toLowerCase().replace(/\s+/g, " ").trim();
			if (seen.has(said)) wrong.push(`${loc}: ${k.id} and ${seen.get(said)} both read ${k.localizations[loc]}`);
			seen.set(said, k.id);
		}
	}
	assert.deepEqual(wrong, []);
});

test("each language Siri speaks gets an AppShortcuts.strings with every phrase, and no other catalog has one", () => {
	const files = build();
	const tables = Object.keys(files).filter((rel) => rel.endsWith("/AppShortcuts.strings")).sort();
	assert.deepEqual(
		tables,
		SIRI_LOCALES.map((l) => `apple/app/network/Shared/Resources/${APPLE_LOCALE[l]}.lproj/AppShortcuts.strings`).sort(),
	);
	for (const loc of SIRI_LOCALES) {
		const table = files[`apple/app/network/Shared/Resources/${APPLE_LOCALE[loc]}.lproj/AppShortcuts.strings`];
		const entries = [...table.matchAll(/^"(.*)" = "(.*)";$/gm)].map((m) => [m[1], m[2]]);
		assert.deepEqual(
			entries,
			[...phrases]
				.sort((a, b) => collate(a.source, b.source))
				.map((k) => [k.source, k.localizations[loc]]),
			loc,
		);
	}
	for (const [rel, content] of Object.entries(files)) {
		if (rel.endsWith("/AppShortcuts.strings")) continue;
		assert.ok(!content.includes(APPLICATION_NAME), `${rel} carries an App Shortcuts phrase`);
	}
});
