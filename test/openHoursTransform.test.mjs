import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMondayHoursToAllDays,
  editorOpenHoursToWeb,
  webOpenHoursToEditor,
} from "../lib/pos/openHoursTransform.ts";

describe("openHoursTransform", () => {
  it("converts web Open_time to editor day map", () => {
    const web = {
      "0": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
      "1": { timeRanges: [{ openTime: "0900", closeTime: "1700" }], timezone: "ET" },
      "2": { timeRanges: [{ openTime: "xxxx", closeTime: "xxxx" }], timezone: "ET" },
      "3": { timeRanges: [{ openTime: "1000", closeTime: "2100" }], timezone: "ET" },
      "4": { timeRanges: [{ openTime: "1000", closeTime: "2100" }], timezone: "ET" },
      "5": { timeRanges: [{ openTime: "1000", closeTime: "2100" }], timezone: "ET" },
      "6": { timeRanges: [{ openTime: "1100", closeTime: "2300" }], timezone: "ET" },
      "7": { timeRanges: [{ openTime: "1200", closeTime: "2000" }], timezone: "ET" },
    };

    const editor = webOpenHoursToEditor(web);

    assert.equal(editor.Mon, "09:00-17:00");
    assert.equal(editor.Tue, "Closed");
    assert.equal(editor.Sun, "12:00-20:00");
  });

  it("round-trips editor hours back to web Open_time", () => {
    const editor = {
      Mon: "09:00-17:00",
      Tue: "Closed",
      Wed: "10:00-21:00",
      Thu: "10:00-21:00",
      Fri: "10:00-21:00",
      Sat: "11:00-23:00",
      Sun: "12:00-20:00",
    };

    const web = editorOpenHoursToWeb(editor, {
      "1": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "PT" },
      "7": { timeRanges: [{ openTime: "0000", closeTime: "2359" }], timezone: "PT" },
    });

    assert.equal(web["1"].timeRanges[0].openTime, "0900");
    assert.equal(web["1"].timeRanges[0].closeTime, "1700");
    assert.equal(web["2"].timeRanges[0].openTime, "xxxx");
    assert.equal(web["7"].timeRanges[0].openTime, "1200");
    assert.equal(web["0"].timeRanges[0].openTime, "1200");
    assert.equal(web["1"].timezone, "PT");
  });

  it("applies Monday hours to every day", () => {
    const next = applyMondayHoursToAllDays({
      Mon: "08:30-18:30",
      Tue: "Closed",
      Wed: "09:00-22:00",
      Thu: "09:00-22:00",
      Fri: "09:00-22:00",
      Sat: "09:00-22:00",
      Sun: "09:00-22:00",
    });

    assert.equal(next.Mon, "08:30-18:30");
    assert.equal(next.Sat, "08:30-18:30");
    assert.equal(next.Sun, "08:30-18:30");
  });
});
