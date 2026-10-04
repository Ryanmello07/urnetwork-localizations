// Mechanical checks on the translations in keys/*.yaml.
//
// validate() (gen/store.mjs) already fails the build when a declared
// placeholder is missing from a localization. These tests cover what it does
// not: a translation that invents a placeholder or a printf conversion English
// does not have, and the Russian house rules a reviewer would otherwise have to
// catch by eye (the apps' unit spelling, formal address, a fixed glossary for
// the product terms, and labels that were cut off mid-phrase).
import assert from "node:assert/strict";
import test from "node:test";

import { isDead, loadStore } from "./store.mjs";

const keys = loadStore();

// every text of a localization: a plain string, or each plural form
const texts = (v) => (v == null ? [] : typeof v === "string" ? [v] : Object.values(v));
const english = (k) => {
	const en = k.localizations.en;
	return typeof en === "string" ? en : en.other;
};

// {name} for the declared placeholders only -- {link}, {terms_start} and the
// like are markers, not placeholders, and pass through untouched
const placeholders = (k, s) =>
	[...new Set((s.match(/\{(\w+)\}/g) || []).map((m) => m.slice(1, -1)))]
		.filter((n) => k.placeholders.some((p) => p.name === n))
		.sort();
// literal printf conversions (a few keys are stored in their platform form)
const conversions = (s) => (s.match(/%(?:\d+\$)?(?:ll|l)?[@dsf]/g) || []).sort();

test("no translation invents a placeholder or a printf conversion", () => {
	const wrong = [];
	for (const k of keys) {
		const enText = english(k);
		for (const [loc, v] of Object.entries(k.localizations)) {
			if (loc === "en") continue;
			const forms = typeof v === "string" ? [["", v]] : Object.entries(v);
			for (const [form, s] of forms) {
				// a non-`other` plural form may spell the count out instead
				const exact = form === "" || form === "other";
				const want = placeholders(k, enText);
				const got = placeholders(k, s);
				if (exact ? got.join() !== want.join() : got.some((n) => !want.includes(n)))
					wrong.push(`${k.id}[${loc}${form && "." + form}]: placeholders ${want} vs ${got}`);
				if (conversions(s).join() !== conversions(enText).join())
					wrong.push(`${k.id}[${loc}${form && "." + form}]: conversions ${conversions(enText)} vs ${conversions(s)}`);
			}
		}
	}
	assert.deepEqual(wrong, []);
});

// ------------------------------------------------------------------ Russian

const russian = keys.filter((k) => k.localizations.ru != null);
const offenders = (pred) =>
	russian.filter((k) => texts(k.localizations.ru).some((s) => pred(s, k))).map((k) => k.id);

test("Russian writes data units as GiB/TiB, as the apps and ur.io do", () => {
	assert.deepEqual(offenders((s) => /[КМГТ]иБ/.test(s)), []);
});

test("Ukrainian writes data units as GiB/TiB, as the apps and ur.io do", () => {
	const ukrainian = keys.filter((k) => k.localizations.uk != null);
	assert.deepEqual(
		ukrainian.filter((k) => texts(k.localizations.uk).some((s) => /[КМГТ][іи]Б/.test(s))).map((k) => k.id),
		[],
	);
});

test("Russian addresses the reader as вы, never ты", () => {
	const ty = /(^|[^а-яё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоих|твоим|твоей|твоего)(?![а-яё])/i;
	assert.deepEqual(offenders((s) => ty.test(s)), []);
});

// one term per product concept

test("Russian says код аутентификации for auth code, as on every login screen", () => {
	assert.deepEqual(offenders((s) => /код\S* авторизации/i.test(s)), []);
});

test("Russian says очки for points; балл is reserved for the Top 200 score", () => {
	assert.deepEqual(offenders((s, k) => /балл/i.test(s) && /\bpoints?\b/i.test(english(k))), []);
});

test("Russian says Условия обслуживания for Terms and Services, as the other consent strings do", () => {
	assert.deepEqual(
		offenders((s, k) => /Terms and Services/.test(english(k)) && !/Услови\S* обслуживания/.test(s)),
		[],
	);
});

test("a Russian label starts with a capital where the English one does", () => {
	// catches a translation cut down to a trailing fragment ("надёжности" for
	// "Reliability Weight"); strings that open with a placeholder are skipped.
	// The reverse is allowed: a lowercase English fragment may lead a Russian
	// sentence ("this region" is "Этот регион" in "{country}: …").
	const up = (c) => c !== c.toLowerCase();
	assert.deepEqual(
		offenders((s, k) => {
			const en = english(k);
			return /^\p{L}/u.test(en) && /^\p{L}/u.test(s) && up(en[0]) && !up(s[0]);
		}),
		[],
	);
});

test("Russian says пригласить for refer a friend, as the referral panel does", () => {
	assert.deepEqual(offenders((s, k) => /\brefer/i.test(english(k)) && /рекоменд/i.test(s)), []);
});

test("Russian says предоставление for providing, in the apps and the ur.io panel alike", () => {
	assert.deepEqual(offenders((s) => /разда(ч|в|ё|е|ю)/i.test(s)), []);
});

test("Russian says логи for logs, never журнал", () => {
	assert.deepEqual(offenders((s, k) => /\blog(s|\b)(?! in)/i.test(english(k)) && /журнал/i.test(s)), []);
});

test("Russian says отвязать/отвязка for unlink, never отключить", () => {
	assert.deepEqual(
		offenders((s, k) => /unlink/i.test(english(k)) && (!/отвяз/i.test(s) || /отключ/i.test(s))),
		[],
	);
});

test("Russian keeps an inserted country name in the nominative", () => {
	// the apps insert the country's display name (or "this region") as is, so
	// "для {country}" reads "для Россия"; the strings lead with "{country}: …"
	assert.deepEqual(
		offenders((s, k) => k.placeholders.some((p) => p.name === "country") && /(^|\s)(для|в|во|из|по)\s+\{country\}/i.test(s)),
		[],
	);
});

test("Russian abbreviates макс. with a period", () => {
	assert.deepEqual(offenders((s) => /(^|[^а-яё])макс(?![а-яё.])/i.test(s)), []);
});

// A count followed by a noun needs the noun's plural form for that count
// ("1 месяц", "3 месяца", "5 месяцев"), so the key must be a plural key. The
// onboarding mail (platform `email`) is rendered into Brevo templates, which
// have no plural selection, and is left out.
const COUNTED_NOUN =
	/^(?:[а-яё]+(?:ых|их|ыми|ими|ым|им)\s+)?(?:месяц|дн[еяи]|день|дней|слов|провайдер|устройств|друз|друг(?:[аи])?(?![а-яё])|минут|час|секунд|недел|год|лет|эпох|контракт)/i;
// fixed counts at their only call site
const FIXED_COUNT = {
	site_usdc_offer_term: "always 12 months plus 14 days (UpgradeSheet.jsx), both the many form",
};

test("a Russian count is followed by its noun only in a plural key", () => {
	const wrong = [];
	for (const k of russian) {
		if (k.plurals || isDead(k) || !k.platforms.length || FIXED_COUNT[k.id]) continue;
		if (k.platforms.every((p) => p === "email")) continue;
		const counted = k.placeholders
			.filter((p) => p.type === "int" || /^(count|days|months|minutes|hours|seconds)$/.test(p.name))
			.map((p) => p.name);
		for (const name of counted) {
			for (const m of k.localizations.ru.matchAll(new RegExp(`\\{${name}\\}\\s+(\\S.*)`, "g")))
				if (COUNTED_NOUN.test(m[1])) wrong.push(`${k.id}: ${k.localizations.ru}`);
		}
	}
	assert.deepEqual(wrong, []);
});
