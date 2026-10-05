import assert from "node:assert/strict";
import test from "node:test";

import { build, taggedKeyList } from "./generate.mjs";
import { isTaggedFor, loadStore } from "./store.mjs";

// the ids of a generated list, its comment lines left out
const ids = (list) => list.split("\n").filter((line) => line && !line.startsWith("#"));

test("a desktop app's list is the keys tagged for it, sorted", () => {
	const keys = [
		{ id: "sample_shared", platforms: ["android", "linux"], deprecated: [] },
		{ id: "sample_desktop", platforms: ["linux", "windows"], deprecated: [] },
		{ id: "sample_retired", platforms: ["linux", "android"], deprecated: ["linux"] },
		{ id: "sample_android", platforms: ["android"], deprecated: [] },
		{ id: "sample_untagged", platforms: [], deprecated: [] },
	];
	assert.deepEqual(ids(taggedKeyList(keys, "linux")), ["sample_desktop", "sample_shared"]);
	assert.deepEqual(ids(taggedKeyList(keys, "windows")), ["sample_desktop"]);
});

test("each desktop app gets its list next to its catalogs", () => {
	const files = build(["windows", "linux"]);
	const keys = loadStore();
	for (const [platform, rel] of [
		["windows", "windows/app/src/App/Strings/windows-keys.txt"],
		["linux", "linux/app/po/linux-keys.txt"],
	]) {
		assert.ok(files[rel], `${rel} was not generated`);
		const want = keys.filter((k) => isTaggedFor(k, platform)).map((k) => k.id).sort();
		assert.deepEqual(ids(files[rel]), want);
	}
});
