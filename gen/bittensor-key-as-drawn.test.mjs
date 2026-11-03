import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

// The one-tap Bittensor key and its claims as the owner approved them in the mocks (2026-11-03): the
// labels as drawn, on every device rather than the mocks' iPhone, and the claim relay's words, which say
// what URnetwork does with a user's claim. Apple's, and Android's since its port, like the key's other strings.

const keys = new Map(loadStore().map((k) => [k.id, k]));

const DRAWN = {
	bittensor_key_keep_confirm_2: "Keep it on this device",
	bittensor_key_save_now_delete_confirm: "Set up payouts and delete key",
	bittensor_key_replace_confirm: "Replace payout wallet",
	bittensor_key_back_up_first: "Back up first",
	bittensor_key_view: "View key",
	bittensor_key_payouts_on: "Payouts are on",
	bittensor_key_enter_two_words: "Enter two of the words",
	bittensor_key_saved_question: "Saved the recovery phrase?",
	bittensor_key_status_unsaved: "Key on this device, not backed up yet",
	bittensor_key_status_saved: "Key on this device, recovery phrase saved",
	sn_claim_relay_for_you: "URnetwork claims this for you",
	sn_claim_relay_claim_now: "Claim now",
	sn_claim_relay_self_claim: "Claim it yourself with your gas key",
};

// the key's strings and the claim relay's
const ours = [...keys.values()].filter((k) => k.id.startsWith("bittensor_key_") || k.id.startsWith("sn_claim_relay_"));

test("the labels as drawn are in the store as the mocks word them", () => {
	for (const [id, en] of Object.entries(DRAWN)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.source, en, id);
		assert.equal(k.localizations.en, en, id);
	}
});

test("they say this device, never the mocks' iPhone", () => {
	assert.ok(100 <= ours.length, `${ours.length} keys`);
	for (const k of ours) {
		for (const [locale, value] of Object.entries(k.localizations)) {
			assert.ok(!/iPhone/.test(value), `${k.id}[${locale}] names the iPhone`);
		}
	}
});

test("the claim relay's strings are the apps', in every locale, and translated", () => {
	const relay = [...keys.values()].filter((k) => k.id.startsWith("sn_claim_relay_"));
	assert.ok(20 <= relay.length, `${relay.length} relay keys`);
	for (const k of relay) {
		assert.ok(k.platforms.includes("apple"), k.id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), k.id);
		for (const locale of LOCALES) {
			if (locale !== "en") assert.notEqual(k.localizations[locale], k.localizations.en, `${k.id}[${locale}] is English`);
			for (const word of ["URnetwork", "TAO", "SN25α"]) {
				if (k.localizations.en.includes(word)) assert.ok(k.localizations[locale].includes(word), `${k.id}[${locale}] lost ${word}`);
			}
		}
	}
});

test("every sentence that names Claim now names the button as it reads", () => {
	const button = keys.get("sn_claim_relay_claim_now").localizations;
	for (const id of ["sn_claim_relay_claim_now_paid", "sn_claim_relay_under_floor", "sn_claim_relay_requested", "sn_claim_relay_again_on", "sn_claim_relay_waits_for_relay"]) {
		const k = keys.get(id);
		assert.ok(k.localizations.en.includes("Claim now"), `CONTROL FAILED: ${id} doesn't name Claim now`);
		for (const locale of LOCALES) {
			assert.ok(k.localizations[locale].includes(button[locale]), `${id}[${locale}] doesn't name the button "${button[locale]}": ${k.localizations[locale]}`);
		}
	}
});

// The claimed state (mock 4d): who claimed, what it paid and where it is, as the mock words it, with the
// transaction, the date Claim now works again and Done from keys the claim screens already have. Every
// app that draws it reads these; Windows and Linux tag them when their code looks them up.
test("the claimed state names who claimed, what it paid and where, in every locale", () => {
	const claimed = keys.get("sn_claim_relay_claimed");
	assert.ok(claimed, "sn_claim_relay_claimed is in the store");
	assert.equal(claimed.source, "Claimed by URnetwork. %@ SN25α is on your key, %@.");
	assert.equal(claimed.localizations.en, "Claimed by URnetwork. {amount} SN25α is on your key, {address}.");
	assert.deepEqual(claimed.placeholders.map((p) => [p.name, p.type]), [["amount", "string"], ["address", "string"]]);
	for (const platform of ["apple", "android"]) assert.ok(claimed.platforms.includes(platform), `not tagged ${platform}`);
	for (const locale of LOCALES) {
		const text = claimed.localizations[locale];
		for (const part of ["{amount}", "{address}", "URnetwork", "SN25α"]) assert.ok(text.includes(part), `sn_claim_relay_claimed[${locale}] lost ${part}: ${text}`);
	}
	for (const id of ["claim_confirmed", "transaction", "done", "sn_claim_relay_again_on"]) {
		const k = keys.get(id);
		assert.ok(k && k.platforms.includes("apple") && k.platforms.includes("android"), `${id} is not on Apple and Android`);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
	}
});
