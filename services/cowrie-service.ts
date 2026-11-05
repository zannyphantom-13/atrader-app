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
  ussd?: string;
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
      { plan_id: "110mb1d", bundleCode: "110mb1d", amount: "100", size: "110MB", duration: "1 Day", name: "110MB", ussd: "SMS 104 to 312" },
      { plan_id: "230mb1d", bundleCode: "230mb1d", amount: "200", size: "230MB", duration: "1 Day", name: "230MB" },
      { plan_id: "500mb1d", bundleCode: "500mb1d", amount: "350", size: "500MB", duration: "1 Day", name: "500MB", ussd: "SMS 175 to 312" },
      { plan_id: "1gb1d", bundleCode: "1gb1d", amount: "500", size: "1GB", duration: "1 Day", name: "1GB + 1.5 Mins Talk Time", ussd: "SMS 155 to 312", description: "Includes 1.5 mins talk time" },
      { plan_id: "2.5gb1d", bundleCode: "2.5gb1d", amount: "750", size: "2.5GB", duration: "1 Day", name: "2.5GB", ussd: "Dial *312*1#" },
      { plan_id: "3.5gb1d", bundleCode: "3.5gb1d", amount: "1000", size: "3.5GB", duration: "1 Day", name: "3.5GB", ussd: "SMS 191 to 312" },
      { plan_id: "1.5gb2d", bundleCode: "1.5gb2d", amount: "600", size: "1.5GB", duration: "2 Days", name: "1.5GB + 100MB YouTube", ussd: "SMS 199 to 312", description: "Includes 100MB YouTube" },
      { plan_id: "2gb2d", bundleCode: "2gb2d", amount: "750", size: "2GB", duration: "2 Days", name: "2GB", ussd: "SMS 154 to 312" },
      { plan_id: "2.5gb2d", bundleCode: "2.5gb2d", amount: "900", size: "2.5GB", duration: "2 Days", name: "2.5GB", ussd: "SMS 146 to 312" },
      { plan_id: "3.2gb2d", bundleCode: "3.2gb2d", amount: "1000", size: "3.2GB", duration: "2 Days", name: "3.2GB", ussd: "SMS 180 to 312" },
      { plan_id: "4gb2d", bundleCode: "4gb2d", amount: "1200", size: "4GB", duration: "2 Days", name: "4GB", ussd: "SMS 192 to 312" },
      { plan_id: "5.5gb2d", bundleCode: "5.5gb2d", amount: "1500", size: "5.5GB", duration: "2 Days", name: "5.5GB", ussd: "SMS 193 to 312" },
      { plan_id: "7gb2d", bundleCode: "7gb2d", amount: "1800", size: "7GB", duration: "2 Days", name: "7GB", ussd: "SMS 183 to 312" },
    ],
    Weekly: [
      { plan_id: "500mb7d", bundleCode: "500mb7d", amount: "500", size: "500MB", duration: "7 Days", name: "500MB + 1.1GB YouTube", ussd: "SMS 103 to 312", description: "Includes 1.1GB YouTube" },
      { plan_id: "1gb7d", bundleCode: "1gb7d", amount: "800", size: "1GB", duration: "7 Days", name: "1GB + 1.1GB YouTube", ussd: "SMS 142 to 312", description: "Includes 1.1GB YouTube" },
      { plan_id: "1.5gb7d", bundleCode: "1.5gb7d", amount: "1000", size: "1.5GB", duration: "7 Days", name: "1.5GB + 1.1GB YouTube", ussd: "SMS 105 to 312", description: "Includes 1.1GB YouTube" },
      { plan_id: "3.5gb7d", bundleCode: "3.5gb7d", amount: "1500", size: "3.5GB", duration: "7 Days", name: "3.5GB", ussd: "SMS 176 to 312" },
      { plan_id: "6gb7d", bundleCode: "6gb7d", amount: "2500", size: "6GB", duration: "7 Days", name: "6GB", ussd: "SMS 143 to 312" },
      { plan_id: "11gb7d", bundleCode: "11gb7d", amount: "3500", size: "11GB", duration: "7 Days", name: "11GB", ussd: "SMS 181 to 312" },
      { plan_id: "15gb7d", bundleCode: "15gb7d", amount: "4000", size: "15GB", duration: "7 Days", name: "15GB", ussd: "SMS 194 to 312" },
      { plan_id: "20gb7d", bundleCode: "20gb7d", amount: "5000", size: "20GB", duration: "7 Days", name: "20GB" },
      { plan_id: "12.5gb14d", bundleCode: "12.5gb14d", amount: "4500", size: "12.5GB", duration: "14 Days", name: "12.5GB (2 Weeks)", ussd: "SMS 195 to 312" },
      { plan_id: "18gb14d", bundleCode: "18gb14d", amount: "6000", size: "18GB", duration: "14 Days", name: "18GB (2 Weeks)", ussd: "SMS 196 to 312" },
      { plan_id: "28gb14d", bundleCode: "28gb14d", amount: "8000", size: "28GB", duration: "14 Days", name: "28GB (2 Weeks)", ussd: "SMS 197 to 312" },
      { plan_id: "40gb14d", bundleCode: "40gb14d", amount: "10000", size: "40GB", duration: "14 Days", name: "40GB (2 Weeks)", ussd: "SMS 198 to 312" },
    ],
    Monthly: [
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1500", size: "2GB", duration: "30 Days", name: "2GB + 2 Mins + Streaming", ussd: "SMS 106 to 312", description: "2 mins talk time + night streaming" },
      { plan_id: "2.7gb30d", bundleCode: "2.7gb30d", amount: "2000", size: "2.7GB", duration: "30 Days", name: "2.7GB + 2 Mins + Streaming", ussd: "SMS 130 to 312", description: "2 mins talk time + night streaming" },
      { plan_id: "3.5gb30d", bundleCode: "3.5gb30d", amount: "2500", size: "3.5GB", duration: "30 Days", name: "3.5GB + 5 Mins + Streaming", ussd: "SMS 131 to 312", description: "5 mins talk time + night streaming" },
      { plan_id: "7gb30d", bundleCode: "7gb30d", amount: "3500", size: "7GB", duration: "30 Days", name: "7GB + 2GB Night", ussd: "SMS 110 to 312", description: "Includes 2GB night data" },
      { plan_id: "10gb30d", bundleCode: "10gb30d", amount: "4500", size: "10GB", duration: "30 Days", name: "10GB + 10 Mins + Streaming", ussd: "SMS 147 to 312", description: "10 mins talk time + night streaming" },
      { plan_id: "12.5gb30d", bundleCode: "12.5gb30d", amount: "5500", size: "12.5GB", duration: "30 Days", name: "12.5GB + Streaming", ussd: "SMS 148 to 312", description: "Includes night streaming" },
      { plan_id: "16.5gb30d", bundleCode: "16.5gb30d", amount: "6500", size: "16.5GB", duration: "30 Days", name: "16.5GB + 10 Mins + Streaming", ussd: "SMS 107 to 312", description: "10 mins talk time + night streaming" },
      { plan_id: "20gb30d", bundleCode: "20gb30d", amount: "7500", size: "20GB", duration: "30 Days", name: "20GB + 4GB Night", ussd: "SMS 116 to 312", description: "Includes 4GB night data" },
      { plan_id: "25gb30d", bundleCode: "25gb30d", amount: "9000", size: "25GB", duration: "30 Days", name: "25GB + 4GB Night", ussd: "SMS 153 to 312", description: "Includes 4GB night data" },
      { plan_id: "36gb30d", bundleCode: "36gb30d", amount: "11000", size: "36GB", duration: "30 Days", name: "36GB", ussd: "SMS 117 to 312" },
      { plan_id: "65gb30d", bundleCode: "65gb30d", amount: "16000", size: "65GB", duration: "30 Days", name: "65GB", ussd: "SMS 178 to 312" },
      { plan_id: "75gb30d", bundleCode: "75gb30d", amount: "18000", size: "75GB", duration: "30 Days", name: "75GB", ussd: "SMS 150 to 312" },
      { plan_id: "165gb30d", bundleCode: "165gb30d", amount: "35000", size: "165GB", duration: "30 Days", name: "165GB", ussd: "SMS 149 to 312" },
    ],
    Mega: [
      { plan_id: "150gb2m", bundleCode: "150gb2m", amount: "40000", size: "150GB", duration: "2 Months / 60 Days", name: "150GB Mega", ussd: "SMS 118 to 312" },
      { plan_id: "480gb3m", bundleCode: "480gb3m", amount: "90000", size: "480GB", duration: "3 Months / 90 Days", name: "480GB Mega", ussd: "SMS 133 to 312" },
    ],
  },

  // Airtel (Code: AIR)
  airtel: {
    Daily: [
      { plan_id: "250mb1d", bundleCode: "250mb1d", amount: "50", size: "250MB", duration: "1 Night (12am-5am)", name: "250MB Night", description: "Valid 12am – 5am" },
      { plan_id: "75mb1d", bundleCode: "75mb1d", amount: "75", size: "75MB", duration: "1 Day", name: "75MB" },
      { plan_id: "110mb1d", bundleCode: "110mb1d", amount: "100", size: "110MB", duration: "1 Day", name: "110MB" },
      { plan_id: "230mb2d", bundleCode: "230mb2d", amount: "200", size: "230MB", duration: "2 Days", name: "230MB" },
      { plan_id: "300mb2d", bundleCode: "300mb2d", amount: "300", size: "300MB", duration: "2 Days", name: "300MB" },
      { plan_id: "500mb1d", bundleCode: "500mb1d", amount: "350", size: "500MB", duration: "1 Day", name: "500MB" },
      { plan_id: "1gb1d", bundleCode: "1gb1d", amount: "500", size: "1GB", duration: "1 Day", name: "1GB Binge" },
      { plan_id: "2gb2d", bundleCode: "2gb2d", amount: "600", size: "2GB", duration: "2 Days", name: "2GB Binge + Bonus", description: "Includes 1GB YouTube Night + 200MB YouTube/IG/TikTok" },
      { plan_id: "3gb2d", bundleCode: "3gb2d", amount: "750", size: "3GB", duration: "2 Days", name: "3GB Binge + Bonus", description: "Includes 1GB YouTube Night + 200MB YouTube/IG/TikTok" },
      { plan_id: "4gb2d", bundleCode: "4gb2d", amount: "1000", size: "4GB", duration: "2 Days", name: "4GB Binge + Bonus", description: "Includes 2GB YouTube Night + 200MB YouTube/IG/TikTok" },
      { plan_id: "6gb2d", bundleCode: "6gb2d", amount: "1500", size: "6GB", duration: "2 Days", name: "6GB Binge + Bonus", description: "Includes 2GB YouTube Night + 200MB YouTube/IG/TikTok" },
    ],
    Weekly: [
      { plan_id: "500mb7d", bundleCode: "500mb7d", amount: "500", size: "500MB", duration: "7 Days", name: "500MB" },
      { plan_id: "1gb7d", bundleCode: "1gb7d", amount: "800", size: "1GB", duration: "7 Days", name: "1GB" },
      { plan_id: "1.5gb7d", bundleCode: "1.5gb7d", amount: "1000", size: "1.5GB", duration: "7 Days", name: "1.5GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "4gb7d", bundleCode: "4gb7d", amount: "1500", size: "4GB", duration: "7 Days", name: "4GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "6gb7d", bundleCode: "6gb7d", amount: "2000", size: "6GB", duration: "7 Days", name: "6GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "8gb7d", bundleCode: "8gb7d", amount: "2500", size: "8GB", duration: "7 Days", name: "8GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "10gb7d", bundleCode: "10gb7d", amount: "3000", size: "10GB", duration: "7 Days", name: "10GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "20gb7d", bundleCode: "20gb7d", amount: "5000", size: "20GB", duration: "7 Days", name: "20GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
    ],
    Monthly: [
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1500", size: "2GB", duration: "30 Days", name: "2GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "3gb30d", bundleCode: "3gb30d", amount: "2000", size: "3GB", duration: "30 Days", name: "3GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "4gb30d", bundleCode: "4gb30d", amount: "2500", size: "4GB", duration: "30 Days", name: "4GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "8gb30d", bundleCode: "8gb30d", amount: "3000", size: "8GB", duration: "30 Days", name: "8GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "10gb30d", bundleCode: "10gb30d", amount: "4000", size: "10GB", duration: "30 Days", name: "10GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "13gb30d", bundleCode: "13gb30d", amount: "5000", size: "13GB", duration: "30 Days", name: "13GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "18gb30d", bundleCode: "18gb30d", amount: "6000", size: "18GB", duration: "30 Days", name: "18GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "25gb30d", bundleCode: "25gb30d", amount: "8000", size: "25GB", duration: "30 Days", name: "25GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "35gb30d", bundleCode: "35gb30d", amount: "10000", size: "35GB", duration: "30 Days", name: "35GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "60gb30d", bundleCode: "60gb30d", amount: "15000", size: "60GB", duration: "30 Days", name: "60GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "100gb30d", bundleCode: "100gb30d", amount: "20000", size: "100GB", duration: "30 Days", name: "100GB (+2.2GB Bonus)", description: "+2.2GB Bonus (YouTube, IG, TikTok)" },
      { plan_id: "160gb30d", bundleCode: "160gb30d", amount: "30000", size: "160GB", duration: "30 Days", name: "160GB" },
      { plan_id: "210gb30d", bundleCode: "210gb30d", amount: "40000", size: "210GB", duration: "30 Days", name: "210GB" },
    ],
    Mega: [
      { plan_id: "300gb3m", bundleCode: "300gb3m", amount: "50000", size: "300GB", duration: "3 Months / 90 Days", name: "300GB Mega" },
      { plan_id: "350gb4m", bundleCode: "350gb4m", amount: "60000", size: "350GB", duration: "4 Months / 120 Days", name: "350GB Mega" },
      { plan_id: "685gb1y", bundleCode: "685gb1y", amount: "100000", size: "685GB", duration: "1 Year / 365 Days", name: "685GB Mega" },
    ],
    Social: [
      { plan_id: "s200mb2d", bundleCode: "s200mb2d", amount: "100", size: "200MB", duration: "2 Days", name: "200MB Social", description: "WhatsApp, IG, FB, TikTok, YouTube" },
      { plan_id: "s1gb3d", bundleCode: "s1gb3d", amount: "300", size: "1GB", duration: "3 Days", name: "1GB Social", description: "WhatsApp, IG, FB, TikTok, YouTube" },
      { plan_id: "s1.5gb7d", bundleCode: "s1.5gb7d", amount: "500", size: "1.5GB", duration: "7 Days", name: "1.5GB Social", description: "WhatsApp, IG, FB, TikTok, YouTube" },
    ],
  },

  // Glo (Code: GLO)
  glo: {
    Daily: [
      { plan_id: "120mb1d", bundleCode: "120mb1d", amount: "100", size: "120MB", duration: "1 Day", name: "120MB + 5MB Night", description: "Includes 5MB night data" },
      { plan_id: "250mb2d", bundleCode: "250mb2d", amount: "200", size: "250MB", duration: "2 Days", name: "250MB + 25MB Night", description: "Includes 25MB night data" },
    ],
    Weekly: [
      { plan_id: "550mb7d", bundleCode: "550mb7d", amount: "500", size: "550MB", duration: "7 Days", name: "550MB + 1GB Night", description: "1.5GB Total (includes 1GB night)" },
      { plan_id: "1.7gb7d", bundleCode: "1.7gb7d", amount: "1000", size: "1.7GB", duration: "7 Days", name: "1.7GB + 2GB Night", description: "3.7GB Total (includes 2GB night)" },
      { plan_id: "4gb7d", bundleCode: "4gb7d", amount: "1500", size: "4GB", duration: "7 Days", name: "4GB + 2GB Night", description: "6GB Total (includes 2GB night)" },
      { plan_id: "6.5gb7d", bundleCode: "6.5gb7d", amount: "2000", size: "6.5GB", duration: "7 Days", name: "6.5GB + 2.5GB Night", description: "9GB Total (includes 2.5GB night)" },
      { plan_id: "22gb7d", bundleCode: "22gb7d", amount: "5000", size: "22GB", duration: "7 Days", name: "22GB + 2.5GB Night", description: "24.5GB Total (includes 2.5GB night)" },
    ],
    Monthly: [
      { plan_id: "2.2gb30d", bundleCode: "2.2gb30d", amount: "1500", size: "2.2GB", duration: "30 Days", name: "2.2GB + 3GB Night", description: "5.2GB Total (includes 3GB night)" },
      { plan_id: "3.25gb30d", bundleCode: "3.25gb30d", amount: "2000", size: "3.25GB", duration: "30 Days", name: "3.25GB + 3GB Night", description: "6.25GB Total (includes 3GB night)" },
      { plan_id: "8.5gb30d", bundleCode: "8.5gb30d", amount: "3000", size: "8.5GB", duration: "30 Days", name: "8.5GB + 2GB Night", description: "10.5GB Total (includes 2GB night)" },
      { plan_id: "14.5gb30d", bundleCode: "14.5gb30d", amount: "5000", size: "14.5GB", duration: "30 Days", name: "14.5GB + 2GB Night", description: "16.5GB Total (includes 2GB night)" },
      { plan_id: "38gb30d", bundleCode: "38gb30d", amount: "10000", size: "38GB", duration: "30 Days", name: "38GB + 4GB Night", description: "42GB Total (includes 4GB night)" },
    ],
    "Campus Booster": [
      { plan_id: "c240mb1d", bundleCode: "c240mb1d", amount: "100", size: "240MB", duration: "1 Day", name: "240MB On-Campus / 120MB Off-Campus" },
      { plan_id: "c500mb2d", bundleCode: "c500mb2d", amount: "200", size: "500MB", duration: "2 Days", name: "500MB On-Campus / 250MB Off-Campus" },
      { plan_id: "c1.1gb7d", bundleCode: "c1.1gb7d", amount: "500", size: "1.1GB", duration: "7 Days", name: "1.1GB On-Campus / 550MB Off-Campus" },
      { plan_id: "c2.2gb30d", bundleCode: "c2.2gb30d", amount: "1000", size: "2.2GB", duration: "30 Days", name: "2.2GB On-Campus / 1.1GB Off-Campus" },
      { plan_id: "c6.5gb30d", bundleCode: "c6.5gb30d", amount: "2000", size: "6.5GB", duration: "30 Days", name: "6.5GB On-Campus / 3.25GB Off-Campus" },
      { plan_id: "c29gb30d", bundleCode: "c29gb30d", amount: "5000", size: "29GB", duration: "30 Days", name: "29GB On-Campus / 14.5GB Off-Campus" },
    ],
  },

  // 9mobile (Code: ETI)
  "9mobile": {
    Daily: [
      { plan_id: "40mb1d", bundleCode: "40mb1d", amount: "50", size: "40MB", duration: "1 Day", name: "40MB", ussd: "Dial *312#" },
      { plan_id: "83mb1d", bundleCode: "83mb1d", amount: "100", size: "83MB", duration: "1 Day", name: "83MB + 50MB Social", ussd: "Dial *312#", description: "Includes 50MB social data" },
      { plan_id: "150mb1d", bundleCode: "150mb1d", amount: "150", size: "150MB", duration: "1 Day", name: "150MB + 100MB Night", ussd: "Dial *312#", description: "Includes 100MB night data" },
      { plan_id: "250mb1d", bundleCode: "250mb1d", amount: "200", size: "250MB", duration: "1 Day", name: "250MB", ussd: "Dial *312#" },
    ],
    Weekly: [
      { plan_id: "25mb7d", bundleCode: "25mb7d", amount: "25", size: "25MB", duration: "7 Days", name: "25MB (Facebook Only)", ussd: "Dial 2291*2#", description: "Facebook only" },
      { plan_id: "650mb7d", bundleCode: "650mb7d", amount: "500", size: "650MB", duration: "7 Days", name: "650MB + 100MB Social", ussd: "Dial *312#", description: "Includes 100MB social data" },
      { plan_id: "3.4gb7d", bundleCode: "3.4gb7d", amount: "1500", size: "3.4GB", duration: "7 Days", name: "3.4GB Special", ussd: "Dial *312#" },
    ],
    Monthly: [
      { plan_id: "80mb30d", bundleCode: "80mb30d", amount: "80", size: "80MB", duration: "30 Days", name: "80MB (Facebook Only)", ussd: "Dial 2291*3#", description: "Facebook only" },
      { plan_id: "2gb30d", bundleCode: "2gb30d", amount: "1000", size: "2GB", duration: "30 Days", name: "2GB", ussd: "Dial *312#" },
      { plan_id: "2.3gb30d", bundleCode: "2.3gb30d", amount: "1200", size: "2.3GB", duration: "30 Days", name: "2.3GB", ussd: "Dial *312#" },
      { plan_id: "4.5gb30d", bundleCode: "4.5gb30d", amount: "2000", size: "4.5GB", duration: "30 Days", name: "4.5GB", ussd: "Dial *312#" },
      { plan_id: "5.2gb30d", bundleCode: "5.2gb30d", amount: "2500", size: "5.2GB", duration: "30 Days", name: "5.2GB", ussd: "Dial *312#" },
      { plan_id: "6.2gb30d", bundleCode: "6.2gb30d", amount: "3000", size: "6.2GB", duration: "30 Days", name: "6.2GB", ussd: "Dial *312#" },
      { plan_id: "8.4gb30d", bundleCode: "8.4gb30d", amount: "4000", size: "8.4GB", duration: "30 Days", name: "8.4GB", ussd: "Dial *312#" },
      { plan_id: "11.4gb30d", bundleCode: "11.4gb30d", amount: "5000", size: "11.4GB", duration: "30 Days", name: "11.4GB", ussd: "Dial *312#" },
      { plan_id: "23gb30d", bundleCode: "23gb30d", amount: "10000", size: "23GB", duration: "30 Days", name: "23GB", ussd: "Dial *312#" },
      { plan_id: "35gb30d", bundleCode: "35gb30d", amount: "15000", size: "35GB", duration: "30 Days", name: "35GB", ussd: "Dial *312#" },
      { plan_id: "47gb30d", bundleCode: "47gb30d", amount: "20000", size: "47GB", duration: "30 Days", name: "47GB", ussd: "Dial *312#" },
      { plan_id: "118gb30d", bundleCode: "118gb30d", amount: "50000", size: "118GB", duration: "30 Days", name: "118GB", ussd: "Dial *312#" },
    ],
  },
};

class CowrieAirtimeService {
  public get baseUrl(): string {
    return process.env.EXPO_PUBLIC_COWRIE_BASE_URL || "https://api.cowriesys.com";
  }

  public get clientId(): string {
    return process.env.EXPO_PUBLIC_COWRIE_CLIENT_ID || "myatraderapp.com";
  }

  public get clientKey(): string {
    return process.env.EXPO_PUBLIC_COWRIE_CLIENT_KEY || "MiynrnmHWvsgV6/HJ6vEppK3mFu456n9M3TJ3NWAh3g=";
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
   * Retrieve available plan category tabs for given network
   */
  public getPlanCategories(network: string): string[] {
    let netKey = (network || "mtn").toLowerCase().trim();
    if (netKey === "t2mobile" || netKey === "etisalat") {
      netKey = "9mobile";
    }
    const networkBundles = COWRIE_DATA_BUNDLES[netKey] || COWRIE_DATA_BUNDLES.mtn;
    return Object.keys(networkBundles);
  }

  /**
   * Retrieve available data plans for given network and category
   */
  public getDataPlans(network: string, category = "Daily"): CowrieDataPlan[] {
    let netKey = (network || "mtn").toLowerCase().trim();
    if (netKey === "t2mobile" || netKey === "etisalat") {
      netKey = "9mobile";
    }
    const networkBundles = COWRIE_DATA_BUNDLES[netKey] || COWRIE_DATA_BUNDLES.mtn;
    if (networkBundles && Array.isArray(networkBundles[category])) {
      return networkBundles[category];
    }
    const firstCat = Object.keys(networkBundles)[0];
    return networkBundles[firstCat] || [];
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

    // If credentials are not configured, fail explicitly
    if (!this.isConfigured()) {
      console.error(`[CowrieService] Cowrie credentials not configured.`);
      return {
        success: false,
        status: "failed",
        reference: xref,
        message: "Cowrie VAS service not configured",
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

    // If credentials are not configured, fail explicitly
    if (!this.isConfigured()) {
      console.error(`[CowrieService] Cowrie credentials not configured.`);
      return {
        success: false,
        status: "failed",
        reference: xref,
        message: "Cowrie VAS service not configured",
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
