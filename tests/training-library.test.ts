import assert from "node:assert/strict";
import test from "node:test";
import {
  filterTrainingLibrary,
  getTrainingLibraryEntry,
  trainingLibrary,
} from "../src/lib/training-library";

test("training library contains six unique, ordered reference entries", () => {
  assert.equal(trainingLibrary.length, 6);
  assert.equal(new Set(trainingLibrary.map((entry) => entry.id)).size, 6);
  assert.equal(new Set(trainingLibrary.map((entry) => entry.displayName)).size, 6);
  assert.deepEqual(
    trainingLibrary.map((entry) => entry.displayName),
    ["康康", "yay", "TenZ", "nAts", "Demon1", "CHICHOO"],
  );
});

test("environment filters match entries without changing source records", () => {
  const gameEntries = filterTrainingLibrary("game");
  const aimlabsEntries = filterTrainingLibrary("aimlabs");
  assert.deepEqual(
    gameEntries.map((entry) => entry.displayName),
    ["康康", "nAts", "CHICHOO"],
  );
  assert.deepEqual(
    aimlabsEntries.map((entry) => entry.displayName),
    ["yay", "TenZ", "Demon1"],
  );
  assert.ok(trainingLibrary.every((entry) => entry.sources.length > 0));
  assert.ok(
    trainingLibrary
      .flatMap((entry) => entry.sources)
      .every((source) => source.url.startsWith("https://")),
  );
});

test("unverified references cannot be represented as complete plans", () => {
  assert.ok(trainingLibrary.every((entry) => entry.contentType !== "完整计划"));
  const yay = getTrainingLibraryEntry("yay-aimlabs-micro-adjustment-partnership");
  assert.equal(yay?.contentType, "单项练习");
  assert.match(yay?.verifiedContent.join(" ") ?? "", /不是.*完整日常训练计划/);
  const demon1 = getTrainingLibraryEntry("demon1-aimlabs-routine-reference");
  assert.equal(demon1?.verificationStatus, "pending");
  assert.deepEqual(demon1?.verifiedContent, []);
});
