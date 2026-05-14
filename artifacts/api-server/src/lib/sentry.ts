// Sentry server-side SDK is intentionally omitted: @sentry/node pulls in
// @opentelemetry/instrumentation which esbuild cannot bundle and pnpm does
// not hoist to a location resolvable from dist/. Errors are still logged
// via pino. Re-enable by switching to a non-bundled deploy strategy.

export function initSentry() {}

export const Sentry = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  captureException(_err: unknown, _ctx?: unknown) {},
};
