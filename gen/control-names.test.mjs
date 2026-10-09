// A line that tells the reader to choose a control names it in the control's
// own words, in every language: the reader looks for the label the screen
// shows, so a paraphrase or a stale translation sends them looking for a
// control that is not there.
//
// The Solana payout wallet's no-wallet messages point at the connect sheet's
// manual entry, which works with any wallet (a Brave Wallet user on android
// was told only to install a wallet, although entering the address worked).
import assert from "node:assert/strict";
import test from "node:test";

import { loadStore } from "./store.mjs";

const keys = new Map(loadStore().map((k) => [k.id, k]));

// key -> the key of the control it names
const NAMES_CONTROL = {
	// the android alert and the iOS note when no wallet app on the device can connect
	no_wallets_found_enter_address_manually: "enter_address_manually",
	// the desktop sheet when the bridge finds no Phantom or Solflare extension
	solana_wallet_error_extension_not_found: "enter_address_manually",
};

test("the payout wallet's no-wallet messages name Enter address manually in every locale", () => {
	const wrong = [];
	for (const [id, controlId] of Object.entries(NAMES_CONTROL)) {
		const k = keys.get(id);
		const control = keys.get(controlId);
		if (!k || !control) {
			wrong.push(`${id}: ${!k ? id : controlId} is not in the store`);
			continue;
		}
		for (const [loc, label] of Object.entries(control.localizations)) {
			const text = k.localizations[loc];
			if (text == null) wrong.push(`${id}[${loc}]: missing`);
			else if (!text.includes(label)) wrong.push(`${id}[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
		}
	}
	assert.deepEqual(wrong, []);
});

test("sign-in keeps its own no-wallet words, since it has no manual entry", () => {
	// signing in needs a wallet's signature, so these must not point at an address field
	for (const id of ["no_wallets_found_alert_content", "bittensor_error_extension_not_found"]) {
		const k = keys.get(id);
		assert.ok(k, `${id} is not in the store`);
		assert.ok(!k.deprecated.length, `${id} is retired`);
		for (const [loc, text] of Object.entries(k.localizations))
			assert.ok(!text.includes(keys.get("enter_address_manually").localizations[loc]), `${id}[${loc}] names manual entry: ${text}`);
	}
});

test("the payout wallet's no-wallet messages are tagged for the apps that show them", () => {
	assert.deepEqual(keys.get("no_wallets_found_enter_address_manually")?.platforms, ["android", "apple"]);
	assert.deepEqual(keys.get("solana_wallet_error_extension_not_found")?.platforms, ["apple", "windows", "linux"]);
});
