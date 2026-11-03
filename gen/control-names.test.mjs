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

import { isTaggedFor, loadStore } from "./store.mjs";

const keys = new Map(loadStore().map((k) => [k.id, k]));

// key -> the key of the control it names
const NAMES_CONTROL = {
	// the android alert and the iOS note when no wallet app on the device can connect
	no_wallets_found_enter_address_manually: "enter_address_manually",
	// the desktop sheet when the bridge finds no Phantom or Solflare extension
	solana_wallet_error_extension_not_found: "enter_address_manually",
	// the extender row when the internet can't reach the device: it can turn the role off
	extender_activation_unreachable: "extender",
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

// The out-of-balance alert on a build whose checkout goes through the tunnel: the
// reader is told to press the Disconnect beside the line, by that button's label.
test("the out-of-balance alert's disconnect-first line names Disconnect in every locale", () => {
	const k = keys.get("insufficient_balance_disconnect_first");
	assert.ok(k, "insufficient_balance_disconnect_first is not in the store");
	const wrong = [];
	for (const [loc, label] of Object.entries(keys.get("disconnect").localizations)) {
		const text = k.localizations[loc];
		if (text == null) wrong.push(`[${loc}]: missing`);
		else if (!text.includes(label)) wrong.push(`[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
	}
	assert.deepEqual(wrong, []);
});

test("the disconnect-first line is tagged for the apps whose alert can show it", () => {
	// Windows and Linux: their Disconnect lifts the kill switch too, so Disconnect
	// is all a payment needs there
	const k = keys.get("insufficient_balance_disconnect_first");
	assert.ok(k, "insufficient_balance_disconnect_first is not in the store");
	assert.deepEqual(
		["android", "apple", "linux", "windows"].filter((p) => isTaggedFor(k, p)),
		["linux", "windows"],
	);
	// iOS and the other android flavors never show it, but they share these
	// catalogs with the builds that do
	assert.deepEqual(keys.get("insufficient_balance_disconnect_first_kill_switch")?.platforms, ["android", "apple"]);
});

// On apple and android the kill switch outlasts a Disconnect: with it on, the
// tunnel keeps running with no connection (shouldRun / vpnServiceRequired: a
// kill switch is route local off) and the sdk drops what it captures, so a
// checkout that goes through the tunnel still can't get out after the
// Disconnect the line asks for. Their line says to turn the kill switch off too,
// naming both controls by their labels (the kill switch's case folded, since a
// label is capitalized and the middle of a sentence is not).
test("on apple and android the disconnect-first line also names the kill switch in every locale", () => {
	const k = keys.get("insufficient_balance_disconnect_first_kill_switch");
	assert.ok(k, "insufficient_balance_disconnect_first_kill_switch is not in the store");
	const wrong = [];
	for (const [controlId, folded] of [["disconnect", false], ["kill_switch", true]]) {
		for (const [loc, label] of Object.entries(keys.get(controlId).localizations)) {
			const text = k.localizations[loc];
			if (text == null) {
				wrong.push(`[${loc}]: missing`);
				continue;
			}
			const names = folded ? text.toLowerCase().includes(label.toLowerCase()) : text.includes(label);
			if (!names) wrong.push(`${controlId}[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
		}
	}
	assert.deepEqual(wrong, []);
});
