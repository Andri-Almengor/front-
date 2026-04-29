import type { ExpoConfig } from "expo/config";
declare const process: any;

function normalizeBaseUrl(url: string) {
  let value = String(url ?? "").trim();

  value = value.replace(/\s+/g, "");
  value = value.replace(/:(\d+):(\d+)($|\/)/, (_m, _a, b, tail) => `:${b}${tail}`);
  value = value.replace(/\/api(\/+)?$/i, "");
  value = value.replace(/\/+$/, "");

  return value;
}

export default (): ExpoConfig => ({
  name: "Kosher Costa Rica",
  slug: "kosher-Costa-Rica",
  owner: "andri-almengor",
  version: "3.0.0",
  orientation: "portrait",
  icon: "./assets/ICONODEAPP.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,

  splash: {
    image: "./assets/LOGo_cis.png",
    resizeMode: "cover",
    backgroundColor: "#335fa6",
  },

  plugins: [
    "expo-notifications",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],

  ios: {
    bundleIdentifier: "com.andrialmengor.koshercostarica",
    buildNumber: "1",
    supportsTablet: true,
  },

  android: {
    package: "com.andrialmengor.koshercostarica",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/ICONODEAPP.png",
      backgroundColor: "#335fa6",
    },
  },

  extra: {
    USE_REMOTE: true,
    API_BASE_URL: normalizeBaseUrl(
      process.env.EXPO_PUBLIC_API_BASE_URL ??
        process.env.API_BASE_URL ??
        "https://app-kosher-costa-rica.onrender.com"
    ),
    eas: {
      projectId: "121697d8-e2d1-4739-a9f9-c33b2cc4a534",
    },
  },
});
