/**
 * Cowrie Integrated Systems Airtime & Data REST API Service
 * Official Specs: https://github.com/cowriesys/airtime
 * Base URL: https://api.cowriesys.com
 *
 * Self-contained pure TypeScript implementation (Zero external crypto dependencies)
 */

export interface CowrieAirtimeRequest {
  network: string; // "airtel" | "glo" | "mtn" | "9mobile" | "t2mobile"
  phone: string;
  amount: number | string;
  xref?: string;
}

export interface CowrieDataRequest {
  network: string;
  phone: string;
  amount: number | string;
  bundle: string; // e.g. "500mb1d", "1.5gb7d", "2gb30d"
  xref?: string;
}

export interface CowrieResponse {
  success: boolean;
  status: "success" | "failed";
  id?: string;
  transid?: string;
  reference?: string;
  message?: string;
  data?: any;
  raw?: any;
}

export interface CowrieDataPlan {
  plan_id: string;
  bundleCode: string;
  amount: string;
  size: string;
  duration: string;
  name: string;
  description?: string;
}

// -------------------------------------------------------------
// PURE TYPESCRIPT CRYPTOGRAPHIC UTILITIES (RFC 2104 / FIPS 180-4)
// Zero native module dependencies - works in all React Native runtimes
// -------------------------------------------------------------

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function sha256Bytes(bytes: Uint8Array): Uint8Array {
  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const l = bytes.length;
  const bitLen = l * 8;
  const newLen = (((l + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(newLen);
  padded.set(bytes);
  padded[l] = 0x80;

  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  padded[newLen - 8] = (highBits >>> 24) & 0xff;
  padded[newLen - 7] = (highBits >>> 16) & 0xff;
  padded[newLen - 6] = (highBits >>> 8) & 0xff;
  padded[newLen - 5] = highBits & 0xff;
  padded[newLen - 4] = (lowBits >>> 24) & 0xff;
  padded[newLen - 3] = (lowBits >>> 16) & 0xff;
  padded[newLen - 2] = (lowBits >>> 8) & 0xff;
  padded[newLen - 1] = lowBits & 0xff;

  const W = new Int32Array(64);
  for (let i = 0; i < newLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      const idx = i + t * 4;
      W[t] = (padded[idx] << 24) | (padded[idx + 1] << 16) | (padded[idx + 2] << 8) | padded[idx + 3];
    }
    for (let t = 16; t < 64; t++) {
      const w15 = W[t - 15];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const w2 = W[t - 2];
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K256[t] + W[t]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  const out = new Uint8Array(32);
  const words = [H0, H1, H2, H3, H4, H5, H6, H7];
  for (let t = 0; t < 8; t++) {
    out[t * 4] = (words[t] >>> 24) & 0xff;
    out[t * 4 + 1] = (words[t] >>> 16) & 0xff;
    out[t * 4 + 2] = (words[t] >>> 8) & 0xff;
    out[t * 4 + 3] = words[t] & 0xff;
  }
  return out;
}

function hmacSha256Bytes(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  const blockSize = 64;
  let key = keyBytes;
  if (key.length > blockSize) {
    key = sha256Bytes(key);
  }
  if (key.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(key);
    key = paddedKey;
  }

  const oPad = new Uint8Array(blockSize);
  const iPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oPad[i] = key[i] ^ 0x5c;
    iPad[i] = key[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + messageBytes.length);
  innerMsg.set(iPad);
  innerMsg.set(messageBytes, blockSize);
  const innerHash = sha256Bytes(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerHash.length);
  outerMsg.set(oPad);
  outerMsg.set(innerHash, blockSize);
  return sha256Bytes(outerMsg);
}

function base64ToUint8(b64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = b64.replace(/=+$/, "");
  const len = str.length;
  const out: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const c0 = chars.indexOf(str[i]);
    const c1 = chars.indexOf(str[i + 1]);
    const c2 = str[i + 2] ? chars.indexOf(str[i + 2]) : 0;
    const c3 = str[i + 3] ? chars.indexOf(str[i + 3]) : 0;
    out.push((c0 << 2) | (c1 >> 4));
    if (str[i + 2]) out.push(((c1 & 15) << 4) | (c2 >> 2));
    if (str[i + 3]) out.push(((c2 & 3) << 6) | c3);
  }
  return new Uint8Array(out);
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : NaN;
    const b2 = i + 2 < len ? bytes[i + 2] : NaN;

    out += chars[b0 >> 2];
    if (isNaN(b1)) {
      out += chars[(b0 & 3) << 4] + "==";
    } else if (isNaN(b2)) {
      out += chars[((b0 & 3) << 4) | (b1 >> 4)] + chars[(b1 & 15) << 2] + "=";
    } else {
      out += chars[((b0 & 3) << 4) | (b1 >> 4)] + chars[((b1 & 15) << 2) | (b2 >> 6)] + chars[b2 & 63];
    }
  }
  return out;
}

// -------------------------------------------------------------
// COWRIE DATA BUNDLES CATALOG
// -------------------------------------------------------------

export const COWRIE_DATA_BUNDLES: Record<string, Record<string, CowrieDataPlan[]>> = {
  // MTN (Code: MTN)
  mtn: {
    Daily: [
      { plan_id: "110mb1d", bundleCode: "110mb1d", amount: "100", size: "110MB", duration: "1 day", name: "Daily 110MB" },
      { plan_id: "230mb1d", bundleCode: "230mb1d", amount: "200", size: "230MB", duration: "1 day", name: "Daily 230MB" },
      { plan_id: "500mb1d", bundleCode: "500mb1d", amount: "350", size: "500MB", duration: "1 day", name: "Daily 500MB" },
      { plan_id: "1gb1d", bundleCode: "1gb1d", amount: "500", size: "1GB", duration: "1 day", name: "Daily 1GB + 1.5 Mins" },
      { plan_id: "2.5gb1d", bundleCode: "2.5gb1d", amount: "750", size: "2.5GB", duration: "1 day", name: "Daily 2.5GB" },
      { plan_id: "3.5gb1d", bundleCode: "3.5gb1d", amount: "1000", size: "3.5GB", duration: "1 day", name: "Daily 3.5GB" },
      { plan_id: "1.5gb2d", bundleCode: "1.5gb2d", amount: "600", size: "1.5GB", duration: "2 days", name: "2-Day 1.5GB" },
      { plan_id: "2gb2d", bundleCode: "2gb2d", amount: "750", size: "2GB", duration: "2 days", name: "2-Day 2GB" },
      { plan_id: "2.5gb2d", bundleCode: "2.5gb2d", amount: "900", size: "2.5GB", duration: "2 days", name: "2-Day 2.5GB" },
      { plan_id: "3.2gb2d", bundleCode: "3.2gb2d", amount: "1000", size: "3.2GB", duration: "2 days", name: "2-Day 3.2GB" },
      { plan_id: "4gb2d", bundleCode: "4gb2d", amount: "1200", size: "4GB", duration: "2 days", name: "2-Day 4GB" },
      { plan_id: "5.5gb2d", bundleCode: "5.5gb2d", amount: "1500", size: "5.5GB", duration: "2 days", name: "2-Day 5.5GB" },
      { plan_id: "7gb2d", bundleCode: "7gb2d", amount: "1800", size: "7GB", duration: "2 days", name: "2-Day 7GB" },
    ],
    Weekly: [
      { plan_id: "500mb7d", bundleCode: "500mb7d", amount: "500", size: "500MB", duration: "7 days", name: "Weekly 500MB" },
      { plan_id: "1gb7d", bundleCode: "1gb7d", amount: "800", size: "1GB", duration: "7 days", name: "Weekly 1GB" },
      { plan_id: "1.5gb7d", bundleCode: "1.5gb7d", amount: "1000", size: "1.5GB", duration: "7 days", name: "Weekly 1.5GB" },
      { plan_id: "3.5gb7d", bundleCode: "3.5gb7d", amount: "1500", size: "3.5GB", duration: "7 days", name: "Weekly 3.5GB" },
      { plan_id: "6gb7d", bundleCode: "6gb7d", amount: "2500", size: "6GB", duration: "7 days", name: "Weekly 6GB" },
      { plan_id: "11gb7d", bundleCode: "11gb7d", amount: "3500", size: "11GB", duration: "7 days", name: "Weekly 11GB" },
      { plan_id: "15gb7d", bundleCode: "15gb7d", amount: "4000", size: "15GB", duration: "7 days", name: "Weekly 15GB" },
      { plan_id: "20gb7d", bundleCode: "20gb7d", amount: "5000", size: "20GB", duration: "7 days", name: "Weekly 20GB" },
      { plan_id: "12.5gb14d", bundleCode: "12.5gb14d", amount: "4500", size: "12.5GB", duration: "14 days", name: "2-Weeks 12.5GB" },
      { plan_id: "18gb14d", bundleCode: "18gb14d", amount: "6000", size: "18GB", duration: "14 days", name: "2-Weeks 18GB" },
      { plan_id: "28gb14d", bundleCode: "28gb14d", amount: "8000", size: "28GB", duration: "14 days", name: "2-Weeks 28GB" },
      { plan_id: "40gb14d", bundleCode: "40gb14d", amount: "10000", size: "40GB", duration: "14 days", name: "2-Weeks 40GB" },
    ],
    Monthly: [
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1500", size: "2GB", duration: "30 days", name: "Monthly 2GB + 2 Mins" },
      { plan_id: "2.7gb30d", bundleCode: "2.7gb30d", amount: "2000", size: "2.7GB", duration: "30 days", name: "Monthly 2.7GB + 2 Mins" },
      { plan_id: "3.5gb30d", bundleCode: "3.5gb30d", amount: "2500", size: "3.5GB", duration: "30 days", name: "Monthly 3.5GB + 5 Mins" },
      { plan_id: "7gb30d", bundleCode: "7gb30d", amount: "3500", size: "7GB", duration: "30 days", name: "Monthly 7GB" },
      { plan_id: "10gb30d", bundleCode: "10gb30d", amount: "4500", size: "10GB", duration: "30 days", name: "Monthly 10GB + 10 Mins" },
      { plan_id: "12.5gb30d", bundleCode: "12.5gb30d", amount: "5500", size: "12.5GB", duration: "30 days", name: "Monthly 12.5GB" },
      { plan_id: "16.5gb30d", bundleCode: "16.5gb30d", amount: "6500", size: "16.5GB", duration: "30 days", name: "Monthly 16.5GB + 10 Mins" },
      { plan_id: "20gb30d", bundleCode: "20gb30d", amount: "7500", size: "20GB", duration: "30 days", name: "Monthly 20GB" },
      { plan_id: "25gb30d", bundleCode: "25gb30d", amount: "9000", size: "25GB", duration: "30 days", name: "Monthly 25GB" },
      { plan_id: "36gb30d", bundleCode: "36gb30d", amount: "11000", size: "36GB", duration: "30 days", name: "Monthly 36GB" },
      { plan_id: "65gb30d", bundleCode: "65gb30d", amount: "16000", size: "65GB", duration: "30 days", name: "Monthly 65GB" },
      { plan_id: "75gb30d", bundleCode: "75gb30d", amount: "18000", size: "75GB", duration: "30 days", name: "Monthly 75GB" },
      { plan_id: "165gb30d", bundleCode: "165gb30d", amount: "35000", size: "165GB", duration: "30 days", name: "Monthly 165GB" },
    ],
  },

  // Airtel (Code: AIR)
  airtel: {
    Daily: [
      { plan_id: "250mb1d", bundleCode: "250mb1d", amount: "50", size: "250MB", duration: "1 night", name: "Night 250MB" },
      { plan_id: "75mb1d", bundleCode: "75mb1d", amount: "75", size: "75MB", duration: "1 day", name: "Daily 75MB" },
      { plan_id: "110mb1d", bundleCode: "110mb1d", amount: "100", size: "110MB", duration: "1 day", name: "Daily 110MB" },
      { plan_id: "230mb2d", bundleCode: "230mb2d", amount: "200", size: "230MB", duration: "2 days", name: "2-Day 230MB" },
      { plan_id: "300mb2d", bundleCode: "300mb2d", amount: "300", size: "300MB", duration: "2 days", name: "2-Day 300MB" },
      { plan_id: "500mb1d", bundleCode: "500mb1d", amount: "350", size: "500MB", duration: "1 day", name: "Daily 500MB" },
      { plan_id: "1gb1d", bundleCode: "1gb1d", amount: "500", size: "1GB", duration: "1 day", name: "Binge 1GB" },
      { plan_id: "2gb2d", bundleCode: "2gb2d", amount: "600", size: "2GB", duration: "2 days", name: "Binge 2GB" },
      { plan_id: "3gb2d", bundleCode: "3gb2d", amount: "750", size: "3GB", duration: "2 days", name: "Binge 3GB" },
      { plan_id: "4gb2d", bundleCode: "4gb2d", amount: "1000", size: "4GB", duration: "2 days", name: "Binge 4GB" },
      { plan_id: "6gb2d", bundleCode: "6gb2d", amount: "1500", size: "6GB", duration: "2 days", name: "Binge 6GB" },
    ],
    Weekly: [
      { plan_id: "500mb7d", bundleCode: "500mb7d", amount: "500", size: "500MB", duration: "7 days", name: "Weekly 500MB" },
      { plan_id: "1gb7d", bundleCode: "1gb7d", amount: "800", size: "1GB", duration: "7 days", name: "Weekly 1GB" },
      { plan_id: "1.5gb7d", bundleCode: "1.5gb7d", amount: "1000", size: "1.5GB", duration: "7 days", name: "Weekly 1.5GB" },
      { plan_id: "4gb7d", bundleCode: "4gb7d", amount: "1500", size: "4GB", duration: "7 days", name: "Weekly 4GB" },
      { plan_id: "6gb7d", bundleCode: "6gb7d", amount: "2000", size: "6GB", duration: "7 days", name: "Weekly 6GB" },
      { plan_id: "8gb7d", bundleCode: "8gb7d", amount: "2500", size: "8GB", duration: "7 days", name: "Weekly 8GB" },
      { plan_id: "10gb7d", bundleCode: "10gb7d", amount: "3000", size: "10GB", duration: "7 days", name: "Weekly 10GB" },
      { plan_id: "20gb7d", bundleCode: "20gb7d", amount: "5000", size: "20GB", duration: "7 days", name: "Weekly 20GB" },
    ],
    Monthly: [
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1500", size: "2GB", duration: "30 days", name: "Monthly 2GB" },
      { plan_id: "3gb30d", bundleCode: "3gb30d", amount: "2000", size: "3GB", duration: "30 days", name: "Monthly 3GB" },
      { plan_id: "4gb30d", bundleCode: "4gb30d", amount: "2500", size: "4GB", duration: "30 days", name: "Monthly 4GB" },
      { plan_id: "8gb30d", bundleCode: "8gb30d", amount: "3000", size: "8GB", duration: "30 days", name: "Monthly 8GB" },
      { plan_id: "10gb30d", bundleCode: "10gb30d", amount: "4000", size: "10GB", duration: "30 days", name: "Monthly 10GB" },
      { plan_id: "13gb30d", bundleCode: "13gb30d", amount: "5000", size: "13GB", duration: "30 days", name: "Monthly 13GB" },
      { plan_id: "18gb30d", bundleCode: "18gb30d", amount: "6000", size: "18GB", duration: "30 days", name: "Monthly 18GB" },
      { plan_id: "25gb30d", bundleCode: "25gb30d", amount: "8000", size: "25GB", duration: "30 days", name: "Monthly 25GB" },
      { plan_id: "35gb30d", bundleCode: "35gb30d", amount: "10000", size: "35GB", duration: "30 days", name: "Monthly 35GB" },
      { plan_id: "60gb30d", bundleCode: "60gb30d", amount: "15000", size: "60GB", duration: "30 days", name: "Monthly 60GB" },
      { plan_id: "100gb30d", bundleCode: "100gb30d", amount: "20000", size: "100GB", duration: "30 days", name: "Monthly 100GB" },
      { plan_id: "160gb30d", bundleCode: "160gb30d", amount: "30000", size: "160GB", duration: "30 days", name: "Monthly 160GB" },
      { plan_id: "210gb30d", bundleCode: "210gb30d", amount: "40000", size: "210GB", duration: "30 days", name: "Monthly 210GB" },
    ],
  },

  // Glo (Code: GLO)
  glo: {
    Daily: [
      { plan_id: "120mb1d", bundleCode: "120mb1d", amount: "100", size: "120MB", duration: "1 day", name: "Daily N100" },
      { plan_id: "250mb2d", bundleCode: "250mb2d", amount: "200", size: "250MB", duration: "2 days", name: "Daily N200" },
      { plan_id: "240mb1d", bundleCode: "240mb1d", amount: "100", size: "240MB", duration: "1 day", name: "Campus Booster N100" },
      { plan_id: "500mb2d", bundleCode: "500mb2d", amount: "200", size: "500MB", duration: "2 days", name: "Campus Booster N200" },
    ],
    Weekly: [
      { plan_id: "550mb7d", bundleCode: "550mb7d", amount: "500", size: "550MB", duration: "7 days", name: "Weekly N500" },
      { plan_id: "1.7gb7d", bundleCode: "1.7gb7d", amount: "1000", size: "1.7GB", duration: "7 days", name: "Weekly N1000" },
      { plan_id: "4gb7d", bundleCode: "4gb7d", amount: "1500", size: "4GB", duration: "7 days", name: "Weekly N1500" },
      { plan_id: "6.5gb7d", bundleCode: "6.5gb7d", amount: "2000", size: "6.5GB", duration: "7 days", name: "Weekly N2000" },
      { plan_id: "22gb7d", bundleCode: "22gb7d", amount: "5000", size: "22GB", duration: "7 days", name: "Weekly N5000" },
      { plan_id: "1.1gb7d", bundleCode: "1.1gb7d", amount: "500", size: "1.1GB", duration: "7 days", name: "Campus Booster N500" },
    ],
    Monthly: [
      { plan_id: "2.2gb30d", bundleCode: "2.2gb30d", amount: "1500", size: "2.2GB", duration: "30 days", name: "Monthly N1500" },
      { plan_id: "3.25gb30d", bundleCode: "3.25gb30d", amount: "2000", size: "3.25GB", duration: "30 days", name: "Monthly N2000" },
      { plan_id: "8.5gb30d", bundleCode: "8.5gb30d", amount: "3000", size: "8.5GB", duration: "30 days", name: "Monthly N3000" },
      { plan_id: "14.5gb30d", bundleCode: "14.5gb30d", amount: "5000", size: "14.5GB", duration: "30 days", name: "Monthly N5000" },
      { plan_id: "38gb30d", bundleCode: "38gb30d", amount: "10000", size: "38GB", duration: "30 days", name: "Monthly N10000" },
      { plan_id: "c2.2gb30d", bundleCode: "c2.2gb30d", amount: "1000", size: "2.2GB", duration: "30 days", name: "Campus Booster N1000" },
      { plan_id: "6.5gb30d", bundleCode: "6.5gb30d", amount: "2000", size: "6.5GB", duration: "30 days", name: "Campus Booster N2000" },
      { plan_id: "29gb30d", bundleCode: "29gb30d", amount: "5000", size: "29GB", duration: "30 days", name: "Campus Booster N5000" },
    ],
  },

  // 9mobile / T2mobile (Code: ETI)
  "9mobile": {
    Daily: [
      { plan_id: "40mb1d", bundleCode: "40mb1d", amount: "50", size: "40MB", duration: "1 day", name: "Daily 40MB" },
      { plan_id: "83mb1d", bundleCode: "83mb1d", amount: "100", size: "83MB", duration: "1 day", name: "Daily 83MB + 50MB Social" },
      { plan_id: "150mb1d", bundleCode: "150mb1d", amount: "150", size: "150MB", duration: "1 day", name: "Daily 150MB + 100MB Night" },
      { plan_id: "250mb1d", bundleCode: "250mb1d", amount: "200", size: "250MB", duration: "1 day", name: "Daily 250MB" },
    ],
    Weekly: [
      { plan_id: "650mb7d", bundleCode: "650mb7d", amount: "500", size: "650MB", duration: "7 days", name: "Weekly 650MB + 100MB Socials" },
      { plan_id: "3.4gb7d", bundleCode: "3.4gb7d", amount: "1500", size: "3.4GB", duration: "7 days", name: "Weekly 3.4GB" },
      { plan_id: "25mb7d", bundleCode: "25mb7d", amount: "25", size: "25MB", duration: "7 days", name: "Facebook Weekly" },
    ],
    Monthly: [
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1000", size: "2GB", duration: "30 days", name: "Monthly 2GB" },
      { plan_id: "2.3gb30d", bundleCode: "2.3gb30d", amount: "1200", size: "2.3GB", duration: "30 days", name: "Monthly 2.3GB" },
      { plan_id: "4.5gb30d", bundleCode: "4.5gb30d", amount: "2000", size: "4.5GB", duration: "30 days", name: "Monthly 4.5GB" },
      { plan_id: "5.2gb30d", bundleCode: "5.2gb30d", amount: "2500", size: "5.2GB", duration: "30 days", name: "Monthly 5.2GB" },
      { plan_id: "6.2gb30d", bundleCode: "6.2gb30d", amount: "3000", size: "6.2GB", duration: "30 days", name: "Monthly 6.2GB" },
      { plan_id: "8.4gb30d", bundleCode: "8.4gb30d", amount: "4000", size: "8.4GB", duration: "30 days", name: "Monthly 8.4GB" },
      { plan_id: "11.4gb30d", bundleCode: "11.4gb30d", amount: "5000", size: "11.4GB", duration: "30 days", name: "Monthly 11.4GB" },
      { plan_id: "23gb30d", bundleCode: "23gb30d", amount: "10000", size: "23GB", duration: "30 days", name: "Monthly 23GB" },
      { plan_id: "35gb30d", bundleCode: "35gb30d", amount: "15000", size: "35GB", duration: "30 days", name: "Monthly 35GB" },
      { plan_id: "47gb30d", bundleCode: "47gb30d", amount: "20000", size: "47GB", duration: "30 days", name: "Monthly 47GB" },
      { plan_id: "118gb30d", bundleCode: "118gb30d", amount: "50000", size: "118GB", duration: "30 days", name: "Monthly 118GB" },
      { plan_id: "80mb30d", bundleCode: "80mb30d", amount: "80", size: "80MB", duration: "30 days", name: "Facebook Monthly" },
    ],
  },
};

class CowrieAirtimeService {
  public get baseUrl(): string {
    return process.env.EXPO_PUBLIC_COWRIE_BASE_URL || "https://api.cowriesys.com";
  }

  public get clientId(): string {
    return process.env.EXPO_PUBLIC_COWRIE_CLIENT_ID || "me@client.com";
  }

  public get clientKey(): string {
    return process.env.EXPO_PUBLIC_COWRIE_CLIENT_KEY || "dGVzdF9jbGllbnRfa2V5X2Jhc2U2NA==";
  }

  /**
   * Check whether real Cowrie credentials are configured
   */
  public isConfigured(): boolean {
    const cid = this.clientId.trim();
    const ckey = this.clientKey.trim();
    return (
      cid.length > 0 &&
      ckey.length > 0 &&
      cid !== "me@client.com" &&
      !cid.includes("placeholder") &&
      !ckey.includes("placeholder")
    );
  }

  /**
   * Normalize phone number to standard international MSISDN format (e.g. 2348124661601)
   */
  public normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return "234" + cleaned.substring(1);
    }
    if (cleaned.startsWith("234")) {
      return cleaned;
    }
    return cleaned;
  }

  /**
   * Map app network ID to Cowrie network code:
   * Airtel -> AIR
   * Glo -> GLO
   * MTN -> MTN
   * 9mobile / T2mobile -> ETI
   */
  public mapNetwork(network: string): string {
    const net = (network || "").toLowerCase().trim();
    switch (net) {
      case "airtel":
        return "AIR";
      case "glo":
        return "GLO";
      case "mtn":
        return "MTN";
      case "9mobile":
      case "ninemobile":
      case "t2mobile":
      case "etisalat":
        return "ETI";
      default:
        return "MTN";
    }
  }

  /**
   * Generate a unique external reference (xref)
   */
  public generateReference(prefix = "AT"): string {
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).substring(2, 9);
    return `${prefix}-${timestamp}${random}`;
  }

  /**
   * Generate nonce (timestamp string format: yyyyMMddHHmmssfff)
   */
  public generateNonce(): string {
    const d = new Date();
    const pad = (n: number, z = 2) => ("00" + n).slice(-z);
    return (
      d.getFullYear().toString() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds()) +
      pad(d.getMilliseconds(), 3)
    );
  }

  /**
   * Compute HMAC256 signature according to Cowrie specification:
   * 1. Concatenate nonce and query string including the question mark "?":
   *    {nonce}?{queryString}
   * 2. Convert base64 encoded ClientKey to bytes
   * 3. Compute SHA256 HMAC of concatenated string
   * 4. Output as base64 string
   */
  public generateSignature(nonce: string, queryString: string): string {
    try {
      const payload = `${nonce}?${queryString}`;
      const keyBytes = base64ToUint8(this.clientKey);
      const msgBytes = new TextEncoder().encode(payload);
      const hmacBytes = hmacSha256Bytes(keyBytes, msgBytes);
      return uint8ToBase64(hmacBytes);
    } catch (e) {
      console.error("[CowrieService] Signature error:", e);
      return "";
    }
  }

  /**
   * Retrieve available data plans for given network and duration
   */
  public getDataPlans(network: string, duration = "Weekly"): CowrieDataPlan[] {
    const netKey = (network || "mtn").toLowerCase();
    const networkBundles = COWRIE_DATA_BUNDLES[netKey] || COWRIE_DATA_BUNDLES.mtn;
    return networkBundles[duration] || networkBundles.Weekly || networkBundles.Daily || [];
  }

  /**
   * Credit Request (Airtime Topup)
   * Request URL: https://api.cowriesys.com/airtime/Credit?net={net}&msisdn={msisdn}&amount={amount}&xref={xref}
   */
  public async vendAirtime(req: CowrieAirtimeRequest): Promise<CowrieResponse> {
    const net = this.mapNetwork(req.network);
    const msisdn = this.normalizePhone(req.phone);
    const amount = req.amount.toString();
    const xref = req.xref || this.generateReference("AT-AIR");

    console.log(`[CowrieService] Credit Request: net=${net}, msisdn=${msisdn}, amount=${amount}, xref=${xref}`);

    // If using test / placeholder credentials, simulate successful response for UI testing
    if (!this.isConfigured()) {
      console.warn(
        `[CowrieService] Test/Placeholder Mode (ClientId: ${this.clientId}). Simulating successful airtime topup.`
      );
      await new Promise((r) => setTimeout(r, 600));
      return {
        success: true,
        status: "success",
        id: "SIM-" + Date.now().toString(16).toUpperCase(),
        transid: xref,
        reference: xref,
        message: "Airtime Topup Completed (Cowrie Sandbox)",
        data: {
          id: "SIM-" + Date.now().toString(16).toUpperCase(),
          net,
          msisdn,
          amount,
          xref,
          message: "OK",
        },
      };
    }

    // Live API Request
    const queryString = `net=${net}&msisdn=${msisdn}&amount=${amount}&xref=${xref}`;
    const nonce = this.generateNonce();
    const signature = this.generateSignature(nonce, queryString);

    const url = `${this.baseUrl.replace(/\/+$/, "")}/airtime/Credit?${queryString}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ClientId: this.clientId,
          Signature: signature,
          Nonce: nonce,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawText: responseText };
      }

      if (response.ok) {
        return {
          success: true,
          status: "success",
          id: data?.id,
          transid: data?.id || xref,
          reference: data?.xref || xref,
          message: data?.message || "Airtime purchase successful",
          data,
          raw: data,
        };
      } else {
        return {
          success: false,
          status: "failed",
          reference: xref,
          message: data?.message || `Cowrie HTTP ${response.status}: ${responseText}`,
          raw: data,
        };
      }
    } catch (err: any) {
      console.error("[CowrieService] Airtime request failed:", err);
      return {
        success: false,
        status: "failed",
        reference: xref,
        message: err?.message || "Network error connecting to Cowrie API",
      };
    }
  }

  /**
   * Data Request (Data Plan Topup)
   * Request URL: https://api.cowriesys.com/data/Credit?net={net}&msisdn={msisdn}&amount={amount}&xref={xref}&bundle={bundle}
   */
  public async vendData(req: CowrieDataRequest): Promise<CowrieResponse> {
    const net = this.mapNetwork(req.network);
    const msisdn = this.normalizePhone(req.phone);
    const amount = req.amount.toString();
    const bundle = req.bundle;
    const xref = req.xref || this.generateReference("AT-DAT");

    console.log(`[CowrieService] Data Request: net=${net}, msisdn=${msisdn}, amount=${amount}, bundle=${bundle}, xref=${xref}`);

    // If using test / placeholder credentials, simulate successful response for UI testing
    if (!this.isConfigured()) {
      console.warn(
        `[CowrieService] Test/Placeholder Mode (ClientId: ${this.clientId}). Simulating successful data topup.`
      );
      await new Promise((r) => setTimeout(r, 600));
      return {
        success: true,
        status: "success",
        id: "SIM-" + Date.now().toString(16).toUpperCase(),
        transid: xref,
        reference: xref,
        message: `Data plan (${bundle}) activated successfully (Cowrie Sandbox)`,
        data: {
          id: "SIM-" + Date.now().toString(16).toUpperCase(),
          net,
          msisdn,
          amount,
          bundle,
          xref,
        },
      };
    }

    // Live API Request
    const queryString = `net=${net}&msisdn=${msisdn}&amount=${amount}&xref=${xref}&bundle=${encodeURIComponent(bundle)}`;
    const nonce = this.generateNonce();
    const signature = this.generateSignature(nonce, queryString);

    const url = `${this.baseUrl.replace(/\/+$/, "")}/data/Credit?${queryString}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ClientId: this.clientId,
          Signature: signature,
          Nonce: nonce,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawText: responseText };
      }

      if (response.ok) {
        return {
          success: true,
          status: "success",
          id: data?.id,
          transid: data?.id || xref,
          reference: data?.xref || xref,
          message: data?.message || "Data plan activated successfully",
          data,
          raw: data,
        };
      } else {
        return {
          success: false,
          status: "failed",
          reference: xref,
          message: data?.message || `Cowrie HTTP ${response.status}: ${responseText}`,
          raw: data,
        };
      }
    } catch (err: any) {
      console.error("[CowrieService] Data request failed:", err);
      return {
        success: false,
        status: "failed",
        reference: xref,
        message: err?.message || "Network error connecting to Cowrie API",
      };
    }
  }

  /**
   * Check Request
   * Request URL: https://api.cowriesys.com/airtime/Check?reference={reference}
   */
  public async checkTransactionStatus(reference: string): Promise<any> {
    if (!this.isConfigured()) {
      return {
        status: "OK",
        reference,
        message: "Simulated Cowrie check: Transaction OK",
      };
    }

    const queryString = `reference=${encodeURIComponent(reference)}`;
    const nonce = this.generateNonce();
    const signature = this.generateSignature(nonce, queryString);

    const url = `${this.baseUrl.replace(/\/+$/, "")}/airtime/Check?${queryString}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ClientId: this.clientId,
        Signature: signature,
        Nonce: nonce,
        Accept: "application/json",
      },
    });

    return await response.json();
  }

  /**
   * Balance Request
   * Request URL: https://api.cowriesys.com/airtime/Balance
   */
  public async getBalance(): Promise<any> {
    if (!this.isConfigured()) {
      return { balance: 100000, discount: 4, simulated: true };
    }

    const nonce = this.generateNonce();
    const signature = this.generateSignature(nonce, "");
    const url = `${this.baseUrl.replace(/\/+$/, "")}/airtime/Balance`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ClientId: this.clientId,
        Signature: signature,
        Nonce: nonce,
        Accept: "application/json",
      },
    });

    return await response.json();
  }
}

export const CowrieService = new CowrieAirtimeService();
