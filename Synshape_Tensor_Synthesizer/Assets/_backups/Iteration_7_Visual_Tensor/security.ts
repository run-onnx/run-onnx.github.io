/**
 * Synshape protection boundary: standards-based encrypted interchange, never a claim of client-side anti-reversing.
 * Telemetry is deliberately not used as key material; browser RNG and a user-supplied passphrase are required.
 */
import { GraphState } from "./tensor";
import { SynshapePreset } from "./presets";

const encoder = new TextEncoder();
const toBase64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, value => String.fromCharCode(value)).join(""));
const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), character => character.charCodeAt(0));

type EncryptedEnvelope = {
  format: string;
  algorithm: string;
  kdf: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

async function derivedKey(
  passphrase: string,
  salt: Uint8Array,
  usages: KeyUsage[]
) {
  if (passphrase.length < 12)
    throw new Error("Use a passphrase with at least 12 characters.");
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usages
  );
}

async function encryptPayload(
  format: string,
  payload: unknown,
  passphrase: string
) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivedKey(passphrase, salt, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return JSON.stringify(
    {
      format,
      algorithm: "AES-256-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations: 210000,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(encrypted)),
    },
    null,
    2
  );
}

async function decryptPayload(
  serialized: string,
  expectedFormat: string,
  passphrase: string
) {
  const envelope = JSON.parse(serialized) as Partial<EncryptedEnvelope>;
  if (
    envelope.format !== expectedFormat ||
    envelope.algorithm !== "AES-256-GCM" ||
    envelope.kdf !== "PBKDF2-SHA-256" ||
    !envelope.salt ||
    !envelope.iv ||
    !envelope.ciphertext
  )
    throw new Error("This is not a supported encrypted Synshape package.");
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);
  const key = await derivedKey(passphrase, salt, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
}

export async function encryptedSynshapePackage(
  graph: GraphState,
  passphrase: string
) {
  return encryptPayload(
    "synshape.encrypted-package/v1",
    {
      format: "synshape.package/v1",
      graph,
      createdAt: new Date().toISOString(),
    },
    passphrase
  );
}

export async function encryptedPresetLibrary(
  presets: SynshapePreset[],
  passphrase: string
) {
  return encryptPayload(
    "synshape.encrypted-preset-library/v1",
    {
      format: "synshape.preset-library/v1",
      exportedAt: new Date().toISOString(),
      presets,
    },
    passphrase
  );
}

export async function decryptedPresetLibrary(
  serialized: string,
  passphrase: string
): Promise<SynshapePreset[]> {
  const payload = (await decryptPayload(
    serialized,
    "synshape.encrypted-preset-library/v1",
    passphrase
  )) as { format?: unknown; presets?: unknown };
  if (
    payload.format !== "synshape.preset-library/v1" ||
    !Array.isArray(payload.presets)
  )
    throw new Error("The decrypted package does not contain a preset library.");
  const valid = payload.presets.every(
    item =>
      item &&
      typeof item === "object" &&
      typeof (item as SynshapePreset).id === "string" &&
      typeof (item as SynshapePreset).name === "string" &&
      (item as SynshapePreset).graph?.nodes &&
      (item as SynshapePreset).graph?.edges
  );
  if (!valid)
    throw new Error("Preset library contains an invalid graph snapshot.");
  return payload.presets as SynshapePreset[];
}

/** A non-security telemetry label; useful for trace readability, never key derivation. */
export async function telemetrySessionLabel(values: Float32Array) {
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const bytes = new Uint8Array(values.byteLength + nonce.length);
  bytes.set(new Uint8Array(values.buffer));
  bytes.set(nonce, values.byteLength);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest.slice(0, 5), value =>
    value.toString(16).padStart(2, "0")
  )
    .join("")
    .toUpperCase();
}
