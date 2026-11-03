/**
 * Expo Config Plugin: zoho-salesiq-plugin.js
 *
 * This plugin runs during `expo prebuild` (and EAS build) to:
 * 1. Patch @react-native-zohosalesiq/mobilisten's build.gradle to use
 *    com.zoho.salesiq:mobilisten:9.0.3 (the version Zoho dashboard requires).
 * 2. Inject ZohoSalesIQ.init(...) into MainApplication.kt so the SDK is
 *    initialized natively on app startup.
 */

const { withDangerousMod, withMainApplication } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Decoded Zoho Android keys (decoded from URL-encoding in .env)
const ANDROID_APP_KEY =
  "WHrKUnHuqmKCXvMr1IvXnesbEYK0hdsT8cFM0Hi1VC1IlHpGTf0tx+OMhleTtJfaaRADl8qGGJs901i2nXRjpnC6EC2fm8XcO0gxq5znuC7KIxSSD87efqHrRiUcnbL6";
const ANDROID_ACCESS_KEY =
  "eJpAb+uEiOdnz7NNDdCeOmw09GBxqrOpbXqy4+/uwkUbqieyySJ2rTLgyAM0kCgB9PZpWxF8SLus3zkFInYqMHP30UD6nsBJSoQKWFsvQYqf3ZdQCGDGk1N18gIplA7ziJs45Fmw9FOWxGu91wlg8n23sQR8nBYH";

// ─── 1. Patch mobilisten build.gradle ────────────────────────────────────────
const withZohoGradlePatch = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const mobilistenGradle = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "@react-native-zohosalesiq",
        "mobilisten",
        "android",
        "build.gradle"
      );

      if (fs.existsSync(mobilistenGradle)) {
        let content = fs.readFileSync(mobilistenGradle, "utf8");

        const OLD = "api 'com.zoho.salesiq:mobilisten:8.2.5'";
        const NEW = "api 'com.zoho.salesiq:mobilisten:9.0.3'";

        if (content.includes(OLD)) {
          content = content.replace(OLD, NEW);
          fs.writeFileSync(mobilistenGradle, content, "utf8");
          console.log("[zoho-plugin] Patched mobilisten build.gradle: 8.2.5 → 9.0.3");
        } else if (content.includes("mobilisten:9.0.3")) {
          console.log("[zoho-plugin] mobilisten already at 9.0.3 ✓");
        } else {
          console.warn("[zoho-plugin] WARNING: mobilisten version line not found — patch skipped.");
        }
      } else {
        console.warn("[zoho-plugin] WARNING: mobilisten build.gradle not found:", mobilistenGradle);
      }

      return config;
    },
  ]);
};

// ─── 2. Inject ZohoSalesIQ.init into MainApplication.kt ──────────────────────
const withZohoMainApplication = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    const zohoImport = "import com.zoho.salesiq.ZohoSalesIQ";
    const zohoInit = `        ZohoSalesIQ.init(this, "${ANDROID_APP_KEY}", "${ANDROID_ACCESS_KEY}")`;

    // Add import after last existing import if not present
    if (!contents.includes(zohoImport)) {
      contents = contents.replace(
        /(import\s+\S+\n)(?!import)/,
        `$1${zohoImport}\n`
      );
      console.log("[zoho-plugin] Added ZohoSalesIQ import to MainApplication");
    }

    // Add init call after super.onCreate() if not present
    if (!contents.includes("ZohoSalesIQ.init(this")) {
      contents = contents.replace(
        /super\.onCreate\(\)/,
        `super.onCreate()\n${zohoInit}`
      );
      console.log("[zoho-plugin] Added ZohoSalesIQ.init() to MainApplication.onCreate()");
    }

    config.modResults.contents = contents;
    return config;
  });
};

// ─── Combined plugin export ───────────────────────────────────────────────────
const withZohoSalesIQ = (config) => {
  config = withZohoGradlePatch(config);
  config = withZohoMainApplication(config);
  return config;
};

module.exports = withZohoSalesIQ;
