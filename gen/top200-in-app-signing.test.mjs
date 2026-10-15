import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";

// Support inbox 7934: a device signs its Top 200 fleet binding in the app
// (Earnings › Top 200 › Sign fleet binding). The ur.io page's steps must name
// that path in the reader's language, with the same words the apps show, and
// the sign screen's strings must be tagged for every app that shows them.

const all = loadAllKeys({ platform: null });
const SITE_LOCALES = ["en", "de", "es", "ru", "zh", "ar"];
const APPS = ["android", "apple", "windows", "linux"];

const SIGN_SCREEN_KEYS = [
	"top200_sign_binding",
	"top200_sign_intro",
	"top200_sign_this_device",
	"top200_sign_client_key",
	"top200_sign_member_hint",
	"top200_sign_copy_member",
	"top200_sign_binding_label",
	"top200_sign_paste",
	"top200_sign_review",
	"top200_sign_fleet_id",
	"top200_sign_hotkey",
	"top200_sign_chain",
	"top200_sign_epochs",
	"top200_sign_action",
	"top200_sign_done",
	"top200_sign_copy_payload",
	"top200_sign_error_invalid",
	"top200_sign_error_other_device",
	"top200_sign_error_no_key",
	"top200_sign_error_failed",
	// reused on the sign screen
	"client_id",
	"copy",
	"copied",
	"top200",
	"earnings",
];

test("the sign screen's strings are tagged for every app", () => {
	for (const id of SIGN_SCREEN_KEYS) {
		assert.ok(all[id], `${id} is in the store`);
		for (const app of APPS) {
			assert.ok(all[id].platforms.includes(app) && !all[id].deprecated?.includes(app), `${id} is tagged for ${app}`);
		}
	}
});

test("every locale of the Top 200 page names the app's sign path in the app's words", () => {
	for (const id of ["site_app_top200_step_bind", "site_app_top200_manifest_hint"]) {
		for (const locale of SITE_LOCALES) {
			const text = all[id].localizations[locale];
			const path = ["earnings", "top200", "top200_sign_binding"].map((k) => all[k].localizations[locale]).join(" › ");
			assert.ok(text.includes(path), `${id} ${locale} names "${path}": ${text}`);
		}
	}
});

test("the page's step 2 still names both CLI paths", () => {
	for (const locale of SITE_LOCALES) {
		const text = all.site_app_top200_step_bind.localizations[locale];
		assert.match(text, /provider fleet sign/, locale);
		assert.match(text, /provider fleet bind/, locale);
		assert.match(text, /URnetwork/, locale);
	}
});
