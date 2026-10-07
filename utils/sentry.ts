import * as Sentry from "@sentry/react-native";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
    environment: __DEV__ ? "development" : "production",
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
  });
};

export { Sentry };

export const captureFatalCrashWithoutFlush = (error: Error) => {
  Sentry.captureException(error);
  // Process exits immediately; network packet never finishes transmission!
};

