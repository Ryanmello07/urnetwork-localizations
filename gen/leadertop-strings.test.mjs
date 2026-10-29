import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// LEADERTOP (owner decision 2026-10-29): the Protocol leaderboard tab and the
// Earnings Top 200 tile. Five apps code against these ids and English texts
// (apple/LEADERTOP.md), and apple looks a string up by its English, so a
// changed text or placeholder breaks a lookup on that platform.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// id -> [English, placeholders as name:type in argument order]
const CONTRACT = {
	leaderboard_tab_protocol: ["Protocol", ""],
	leaderboard_protocol_banner_closed: ["Claiming isn't open yet. You can see where you'd rank now.", ""],
	leaderboard_protocol_banner_stale: ["Rankings last updated {time}.", "time:string"],
	leaderboard_protocol_projected: ["projected", ""],
	leaderboard_protocol_of_ranked: ["of {count} ranked networks", "count:int"],
	leaderboard_protocol_above_line: ["{percent} above the Top 200 line", "percent:string"],
	leaderboard_protocol_below_line: ["{percent} below the Top 200 line", "percent:string"],
	leaderboard_protocol_trend_up: ["up {count} since the last update", "count:int"],
	leaderboard_protocol_trend_down: ["down {count} since the last update", "count:int"],
	leaderboard_protocol_why: ["{prefixes} distinct IP prefixes, {shared} shared with other networks.", "prefixes:int shared:int"],
	leaderboard_protocol_solo: ["If you claimed alone today: {score}.", "score:string"],
	leaderboard_protocol_you: ["You", ""],
	leaderboard_protocol_label_estimate: ["Estimate", ""],
	leaderboard_protocol_label_likely: ["Likely", ""],
	leaderboard_protocol_label_borderline: ["Borderline", ""],
	leaderboard_protocol_label_unlikely: ["Unlikely", ""],
	leaderboard_protocol_label_not_measurable: ["Not measurable", ""],
	leaderboard_protocol_chart_title: ["Projected rank, last 90 days", ""],
	leaderboard_protocol_chart_line: ["Top 200 line", ""],
	leaderboard_protocol_chart_a11y: ["Projected rank over 90 days, now {rank}", "rank:int"],
	leaderboard_protocol_claim_inside: ["You're projected in the top 200.", ""],
	leaderboard_protocol_claim_button: ["Claim on Earnings", ""],
	leaderboard_protocol_claim_soon: ["Claiming opens soon on the Earnings page.", ""],
	leaderboard_protocol_claim_borderline: ["You're close to the line, and rankings change every tempo.", ""],
	leaderboard_protocol_claim_warning: ["A claimed fleet that ranks 201 or lower earns nothing.", ""],
	leaderboard_protocol_not_measurable_cohort: ["Your devices aren't measured by the validator yet.", ""],
	leaderboard_protocol_not_measurable_shared: ["Your devices share an IP with another network.", ""],
	leaderboard_protocol_not_measurable_providing: ["Turn on providing to be ranked.", ""],
	leaderboard_protocol_line: ["Top 200 line · score {score}", "score:string"],
	leaderboard_protocol_line_a11y: ["Top 200 line, score {score}", "score:string"],
	leaderboard_protocol_uid: ["UID {uid}", "uid:int"],
	leaderboard_protocol_explainer: [
		"Ranked the way the SN25 validator picks its Top 200: by how many distinct IP prefixes your devices provide from, with shared prefixes split between the networks on them. Updated about every 72 minutes. These are projections until you claim.",
		"",
	],
	leaderboard_protocol_empty: ["Rankings will appear after the next update.", ""],
	leaderboard_protocol_detail_claimed: ["claimed", ""],
	leaderboard_protocol_detail_projected_rank: ["Projected rank", ""],
	leaderboard_protocol_detail_validator_rank: ["Validator rank", ""],
	leaderboard_protocol_detail_validator_rank_value: ["#{rank} of {count} claimed", "rank:int count:int"],
	leaderboard_protocol_detail_validator_score: ["Validator score", ""],
	leaderboard_protocol_detail_replica_score: ["Board replica score", ""],
	leaderboard_protocol_detail_incentive: ["On-chain incentive", ""],
	leaderboard_protocol_detail_stale: ["stale", ""],
	leaderboard_protocol_detail_generation: ["Generation", ""],
	leaderboard_protocol_detail_valid_until: ["Claim valid until", ""],
	leaderboard_protocol_detail_epoch: ["Epoch {epoch}", "epoch:int"],
	leaderboard_protocol_detail_selected: ["Selected", ""],
	leaderboard_protocol_detail_not_selected: ["Not selected", ""],
	leaderboard_protocol_detail_incentive_note: ["On-chain incentive lags the validator's ranking.", ""],
	earnings_top200_projected: ["projected · {margin}", "margin:string"],
	earnings_top200_body: [
		"Ranked like the SN25 validator's Top 200, by the distinct IP prefixes your devices provide from. Head miners earn SN25α every tempo.",
		"",
	],
	earnings_top200_claiming_soon: ["Claiming opens soon", ""],
	earnings_top200_claiming_soon_body: [
		"We'll let you know when you can claim your spot. A claimed fleet that ranks 201 or lower earns nothing.",
		"",
	],
	earnings_top200_see_board: ["See the Protocol leaderboard", ""],
};

// Apple has one catalog entry per English text: these two read the entry an
// apple-tagged key already owns, so they are not tagged apple themselves.
const APPLE_READS = {
	leaderboard_protocol_you: "route_you",
	leaderboard_protocol_detail_epoch: "epoch_row_title",
};

// the existing keys the screens reuse instead of adding their own
const REUSED = ["show_on_points_leaderboard", "close", "cancel", "retry", "done", "anonymous", "points", "data"];

const signature = (k) => k.placeholders.map((p) => `${p.name}:${p.type}`).join(" ");
// apple's literal: the English with each placeholder as its Swift conversion
const appleLiteral = (k) =>
	k.placeholders.reduce((s, p) => s.split(`{${p.name}}`).join(p.type === "int" ? "%lld" : "%@"), k.localizations.en);

test("every LEADERTOP key carries the contract's English and placeholders", () => {
	for (const [id, [en, placeholders]] of Object.entries(CONTRACT)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, en, id);
		assert.equal(signature(k), placeholders, id);
		assert.equal(k.source, appleLiteral(k), `${id}: source is the literal apple looks up`);
		assert.ok(!k.plurals, `${id} is a plain string, not a plural key`);
	}
});

test("every LEADERTOP key is translated into every store locale", () => {
	for (const id of Object.keys(CONTRACT))
		assert.deepEqual(LOCALES.filter((l) => keys.get(id).localizations[l] == null), [], id);
});

test("the LEADERTOP keys are tagged for the site, apple and android", () => {
	for (const id of Object.keys(CONTRACT)) {
		const k = keys.get(id);
		for (const p of ["site", "android"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
		assert.equal(isTaggedFor(k, "apple"), !APPLE_READS[id], `${id}: apple tag`);
	}
});

test("apple reads a shared English from the entry that owns it", () => {
	for (const [id, owner] of Object.entries(APPLE_READS)) {
		const k = keys.get(id);
		const o = keys.get(owner);
		assert.ok(isTaggedFor(o, "apple"), `${owner} is on apple`);
		assert.equal(o.source, k.source, `${id} reads ${owner}`);
		assert.equal(signature(o), signature(k), `${id} and ${owner} take the same arguments`);
	}
});

test("the reused keys are tagged for the site, apple and android", () => {
	for (const id of REUSED)
		for (const p of ["site", "apple", "android"]) assert.ok(isTaggedFor(keys.get(id), p), `${id} is tagged ${p}`);
	assert.equal(keys.get("show_on_points_leaderboard").localizations.en, "Show my network name");
});

test("the claim prompt names the Earnings page, and the tile the Protocol tab, in their own words", () => {
	const names = {
		leaderboard_protocol_claim_button: "earnings",
		leaderboard_protocol_claim_soon: "earnings",
		earnings_top200_see_board: "leaderboard_tab_protocol",
	};
	const wrong = [];
	for (const [id, named] of Object.entries(names))
		for (const l of LOCALES) {
			const label = keys.get(named).localizations[l];
			const text = keys.get(id).localizations[l];
			if (!text.includes(label)) wrong.push(`${id}[${l}] does not name ${JSON.stringify(label)}: ${text}`);
		}
	assert.deepEqual(wrong, []);
});
