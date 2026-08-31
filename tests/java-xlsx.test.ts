import assert from "node:assert/strict";
import test from "node:test";

import { xlsxTargetVersionsToCsv } from "../src/stacks/java/workflow/xlsx.ts";
import { parseJavaTargetVersionsCsv } from "../src/stacks/java/workflow/terminal.ts";

interface StoredZipEntry {
  name: string;
  content: string;
}

function storedZip(entries: StoredZipEntry[]): ArrayBuffer {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, localOffset, true);
    central.set(name, 46);
    centralParts.push(central);

    localOffset += local.length;
  }

  const centralOffset = localOffset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);

  const total =
    localParts.reduce((sum, part) => sum + part.length, 0) +
    centralSize +
    end.length;
  const zip = new Uint8Array(total);
  let offset = 0;
  for (const part of [...localParts, ...centralParts, end]) {
    zip.set(part, offset);
    offset += part.length;
  }
  return zip.buffer;
}

test("XLSX target-version reader extracts the actual first worksheet values", async () => {
  const sharedStrings = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    "<si><t>groupId</t></si>",
    "<si><t>artifactId</t></si>",
    "<si><t>targetVersion</t></si>",
    "<si><t>org.springframework.boot</t></si>",
    "<si><t>spring-boot-dependencies</t></si>",
    "<si><t>4.0.0</t></si>",
    "</sst>",
  ].join("");

  const sheet = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>',
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>',
    '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c></row>',
    "</sheetData></worksheet>",
  ].join("");

  const workbook = storedZip([
    { name: "xl/sharedStrings.xml", content: sharedStrings },
    { name: "xl/worksheets/sheet1.xml", content: sheet },
  ]);

  const csv = await xlsxTargetVersionsToCsv(workbook);
  assert.equal(
    csv,
    [
      "groupId,artifactId,targetVersion",
      "org.springframework.boot,spring-boot-dependencies,4.0.0",
    ].join("\n"),
  );

  assert.deepEqual(parseJavaTargetVersionsCsv(csv), [
    {
      groupId: "org.springframework.boot",
      artifactId: "spring-boot-dependencies",
      targetVersion: "4.0.0",
    },
  ]);
});
