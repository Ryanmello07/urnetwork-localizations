import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

// The one-tap Bittensor key and its claims as the owner approved them in the mocks (2026-11-03): the
// labels as drawn, on every device rather than the mocks' iPhone, and the claim relay's words, which say
// what URnetwork does with a user's claim. These are Apple's for now, like the key's other strings.

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

test("the claim relay's strings are Apple's for now, in every locale, and translated", () => {
	const relay = [...keys.values()].filter((k) => k.id.startsWith("sn_claim_relay_"));
	assert.ok(20 <= relay.length, `${relay.length} relay keys`);
	for (const k of relay) {
		assert.deepEqual(k.platforms, ["apple"], k.id);
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
