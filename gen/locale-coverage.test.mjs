// Every key carries every locale it needs (requiredLocales in store.mjs).
//
// validate() checks what a translation contains, not whether it exists, and no
// generator fails on a missing locale: the apps fall back to English for that
// one string. That is how earnings_wallet_mismatch came to show English in 22
// of 28 languages.
import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, SITE_LOCALES, loadStore, requiredLocales } from "./store.mjs";

const key = (platforms, rest = {}) => ({ id: "k", platforms, deprecated: [], translatable: true, ...rest });

test("a key an app, the extension or the mail uses needs every locale", () => {
	for (const platforms of [["android"], ["apple"], ["web"], ["email"], ["site", "linux"], []])
		assert.deepEqual(requiredLocales(key(platforms)), LOCALES, platforms.join());
});

test("a key only the ur.io site uses needs the site's locales", () => {
	assert.deepEqual(requiredLocales(key(["site"])), SITE_LOCALES);
	assert.deepEqual(requiredLocales(key(["site", "apple"], { deprecated: ["apple"] })), SITE_LOCALES);
});

test("a dead key needs no locale and an untranslatable one only English", () => {
	assert.deepEqual(requiredLocales(key(["apple"], { deprecated: ["apple"] })), []);
	assert.deepEqual(requiredLocales(key(["android"], { translatable: false })), ["en"]);
});

test("every key in the store carries every locale it needs", () => {
	const missing = [];
	for (const k of loadStore()) {
		const absent = requiredLocales(k).filter((l) => k.localizations[l] == null);
		if (absent.length) missing.push(`${k.id}: ${absent.join(" ")}`);
	}
	assert.deepEqual(missing, []);
});
