import assert from "node:assert/strict";
import test from "node:test";

import { SITE_LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// ur.io's Bittensor wallet errors (mmm ur.io/react/src/auth/bittensorWallet.js
// ERROR_KEYS): a wallet's own refusal reaches the page as a code with a store
// string, never in the wallet's English (support inbox 8142: Talisman's "Site
// https://ur.io/app/account/earnings has not been authorised for Talisman
// yet" showed as is to a Russian reader). The site looks these up by id with
// the wallet's name as {wallet}.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// the two strings only ur.io shows: id -> English
const SITE_ONLY = {
	bittensor_error_extension_not_authorized:
		"{wallet} hasn't allowed ur.io to use your Bittensor account yet. Approve the connection request in the wallet, or allow ur.io under Connected Sites in its settings, then try again.",
	bittensor_error_wallet_failed: "Your {wallet} wallet couldn't finish the request. Check the wallet, then try again.",
};

// the apps' bridge-code strings the site now shows for the same codes
const REUSED = ["bittensor_error_user_rejected", "bittensor_error_no_account", "bittensor_error_walletconnect_expired"];

test("the site-only wallet errors carry their English, the wallet's name once, and the site's locales", () => {
	for (const [id, en] of Object.entries(SITE_ONLY)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, en, id);
		assert.equal(k.source, en, `${id}: source is the English`);
		assert.deepEqual(k.platforms, ["site"], id);
		assert.deepEqual(k.placeholders, [{ name: "wallet", type: "string" }], id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...SITE_LOCALES].sort(), id);
		// one {wallet}: the desktop catalogs, which carry every live key, lower a
		// lone placeholder to a single "{}"
		for (const [l, v] of Object.entries(k.localizations))
			assert.equal(v.split("{wallet}").length - 1, 1, `${id}[${l}] names the wallet once: ${v}`);
	}
});

// Talisman's own name for its settings page of connected sites, in the
// languages it ships (public/locales/<l>/common.json "Connected Sites"); it
// has no Arabic, so an Arabic reader sees the English one
const TALISMAN_CONNECTED_SITES = {
	ar: "Connected Sites",
	de: "Verbundene Seiten",
	en: "Connected Sites",
	es: "Sitios Conectados",
	ru: "Подключенные сайты",
	zh: "连接网站",
};

test("the not-authorised error names ur.io and Talisman's own Connected Sites in every language", () => {
	for (const id of Object.keys(SITE_ONLY)) {
		const k = keys.get(id);
		for (const l of SITE_LOCALES.filter((l) => l !== "en"))
			assert.notEqual(k.localizations[l], k.localizations.en, `${id}[${l}] is translated`);
	}
	const k = keys.get("bittensor_error_extension_not_authorized");
	for (const l of SITE_LOCALES) {
		assert.ok(k.localizations[l].includes("ur.io"), `[${l}] names ur.io`);
		assert.ok(k.localizations[l].includes(TALISMAN_CONNECTED_SITES[l]), `[${l}] names ${TALISMAN_CONNECTED_SITES[l]}`);
	}
});

test("the reused bridge-code strings are tagged for the site and keep their apps", () => {
	for (const id of REUSED) {
		const k = keys.get(id);
		for (const p of ["site", "android", "apple", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
	}
});
