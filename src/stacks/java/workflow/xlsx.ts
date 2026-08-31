const ZIP_LOCAL_FILE = 0x04034b50;
const ZIP_CENTRAL_FILE = 0x02014b50;
const ZIP_END = 0x06054b50;

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_END) return offset;
  }
  throw new Error("XLSX ZIP directory is missing or unsupported.");
}

function readZipEntries(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const end = findEndOfCentralDirectory(view);
  const totalEntries = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_FILE) {
      throw new Error("XLSX ZIP central directory is malformed.");
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(
      bytes.subarray(offset + 46, offset + 46 + fileNameLength),
    );

    entries.push({
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress XLSX worksheet data.");
  }

  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(
  buffer: ArrayBuffer,
  entry: ZipEntry,
): Promise<string> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== ZIP_LOCAL_FILE) {
    throw new Error("XLSX ZIP local file header is malformed.");
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(
    dataStart,
    dataStart + entry.compressedSize,
  );

  let payload: Uint8Array;
  if (entry.compressionMethod === 0) {
    payload = compressed;
  } else if (entry.compressionMethod === 8) {
    payload = await inflateRaw(compressed);
  } else {
    throw new Error(
      "Unsupported XLSX ZIP compression method: " +
        entry.compressionMethod +
        ".",
    );
  }

  if (
    entry.uncompressedSize > 0 &&
    payload.byteLength !== entry.uncompressedSize
  ) {
    throw new Error("XLSX ZIP entry size validation failed.");
  }

  return new TextDecoder().decode(payload);
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function textNodes(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1] ?? ""))
    .join("");
}

function parseSharedStrings(xml: string | null): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(
    (match) => textNodes(match[1] ?? ""),
  );
}

function columnIndex(cellReference: string): number {
  const letters = cellReference.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return -1;

  let value = 0;
  for (const letter of letters) {
    value = value * 26 + letter.charCodeAt(0) - 64;
  }
  return value - 1;
}

function attribute(source: string, name: string): string | null {
  const match = source.match(
    new RegExp("\\b" + name + '="([^"]*)"', "i"),
  );
  return match?.[1] ?? null;
}

function cellValue(
  attrs: string,
  body: string,
  sharedStrings: string[],
): string {
  const type = attribute(attrs, "t");

  if (type === "inlineStr") {
    return textNodes(body);
  }

  const raw = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") {
    const index = Number(raw);
    return Number.isInteger(index) ? sharedStrings[index] ?? "" : "";
  }

  return decodeXml(raw.trim());
}

function parseFirstWorksheet(
  xml: string,
  sharedStrings: string[],
): string[][] {
  const rows: string[][] = [];

  for (const rowMatch of xml.matchAll(
    /<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g,
  )) {
    const cells: string[] = [];
    const rowBody = rowMatch[1] ?? "";

    for (const cellMatch of rowBody.matchAll(
      /<c([^>]*)>([\s\S]*?)<\/c>/g,
    )) {
      const attrs = cellMatch[1] ?? "";
      const reference = attribute(attrs, "r") ?? "";
      const index = columnIndex(reference);
      if (index < 0 || index > 2) continue;
      cells[index] = cellValue(
        attrs,
        cellMatch[2] ?? "",
        sharedStrings,
      );
    }

    if (cells.some((value) => (value ?? "").trim().length > 0)) {
      rows.push([
        cells[0] ?? "",
        cells[1] ?? "",
        cells[2] ?? "",
      ]);
    }
  }

  return rows;
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replaceAll('"', '""') + '"';
  }
  return value;
}

export async function xlsxTargetVersionsToCsv(
  buffer: ArrayBuffer,
): Promise<string> {
  const entries = readZipEntries(buffer);
  const worksheet = entries.find(
    (entry) => entry.name === "xl/worksheets/sheet1.xml",
  );
  if (!worksheet) {
    throw new Error("XLSX first worksheet is missing.");
  }

  const sharedEntry = entries.find(
    (entry) => entry.name === "xl/sharedStrings.xml",
  );
  const [sheetXml, sharedXml] = await Promise.all([
    readZipEntry(buffer, worksheet),
    sharedEntry ? readZipEntry(buffer, sharedEntry) : Promise.resolve(null),
  ]);

  const rows = parseFirstWorksheet(
    sheetXml,
    parseSharedStrings(sharedXml),
  );

  if (rows.length === 0) {
    throw new Error("XLSX first worksheet contains no target-version rows.");
  }

  return rows
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}
