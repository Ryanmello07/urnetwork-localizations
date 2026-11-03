import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

// The one-tap Bittensor key (apple/BTEASY.md, Wording). These are security warnings about money, so the
// plan's own sentences are pinned, and what a reader has to recognize stays as printed in every locale:
// the token, the wallets they could enter the phrase into, and the command.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const ours = [...keys.values()].filter((k) => k.id.startsWith("bittensor_key_"));

const PLAN = {
	bittensor_key_wording_not_wallet:
		"URnetwork is not a wallet. It created this key so you can receive SN25α. To transfer or use your SN25α, enter this recovery phrase into a Bittensor wallet such as Talisman or Nova, or into btcli.",
	bittensor_key_wording_control:
		"Anyone with this phrase controls your SN25α. URnetwork will never ask for it, and can't recover it. If you lose this device before saving it, your SN25α can't be reached.",
	bittensor_key_confirm_top200:
		"Deleting this key also gives up claiming a Top 200 spot with one tap. You could still claim from a Bittensor wallet holding this recovery phrase.",
	bittensor_key_delete_action: "I have saved the key, it's OK to delete it now.",
	bittensor_key_set_up: "Set up payouts",
	bittensor_key_save_first: "Save the recovery phrase first",
	bittensor_key_use_wallet: "Use a wallet I already have",
	bittensor_key_payouts_start: "Payouts start next epoch",
	bittensor_key_back_up: "Back up your key",
	bittensor_key_no_longer_here: "This app no longer has the key",
	bittensor_key_reveal: "Tap to reveal",
};

// never translated, and a translation that drops one has dropped part of the warning
const VERBATIM = ["URnetwork", "Bittensor", "TAO", "SN25α", "Talisman", "Nova", "btcli"];

test("the plan's sentences are in the store as it words them", () => {
	for (const [id, en] of Object.entries(PLAN)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.source, en, id);
		assert.equal(k.localizations.en, en, id);
	}
});

// Apple's first; each port tags the keys it looks up, Windows and Linux only once their code does
const APPS = ["apple", "android", "windows", "linux"];

test("every key is the apple app's and the ports' that look it up, in every locale, with its English as its source", () => {
	assert.ok(50 <= ours.length, `${ours.length} keys`);
	for (const k of ours) {
		assert.ok(k.platforms.includes("apple"), k.id);
		assert.ok(k.platforms.every((p) => APPS.includes(p)), `${k.id}: ${k.platforms}`);
		assert.equal(new Set(k.platforms).size, k.platforms.length, `${k.id} is tagged twice`);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), k.id);
		if (!k.placeholders?.length) assert.equal(k.localizations.en, k.source, k.id);
	}
});

test("what a reader has to recognize stays as printed in every locale", () => {
	for (const k of ours) {
		for (const word of VERBATIM) {
			if (!k.localizations.en.includes(word)) continue;
			for (const [locale, value] of Object.entries(k.localizations)) {
				assert.ok(value.includes(word), `${k.id}[${locale}] lost ${word}: ${value}`);
			}
		}
	}
});

test("the delete warning names Top 200 as the Top 200 tile does in each locale", () => {
	const tile = keys.get("top200");
	const warning = keys.get("bittensor_key_confirm_top200");
	assert.ok(tile && warning);
	for (const [locale, value] of Object.entries(warning.localizations)) {
		const name = tile.localizations[locale] ?? tile.localizations.en;
		assert.ok(value.includes(name), `${locale} does not say ${name}: ${value}`);
	}
});

test("no translation is left in English, except what is the same word there", () => {
	for (const k of ours) {
		const english = k.localizations.en;
		// a line of more than a few words reading exactly as the English was not translated
		if (english.split(" ").length < 3) continue;
		for (const [locale, value] of Object.entries(k.localizations)) {
			if (locale !== "en") assert.notEqual(value, english, `${k.id}[${locale}]`);
		}
	}
});

test("the word's number stays in the field's label in every locale", () => {
	const k = keys.get("bittensor_key_word_number");
	assert.equal(k.source, "Word %lld");
	assert.deepEqual(k.placeholders, [{ name: "position", type: "int" }]);
	for (const [locale, value] of Object.entries(k.localizations)) {
		assert.equal(value.split("{position}").length, 2, `${locale}: ${value}`);
	}
});
