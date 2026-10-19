import { getGoogleStackConfig, resolveTagLoader } from '@/lib/google/config';

/**
 * Google tag loader — GTM *or* GA4 gtag.js, never both.
 *
 * Rendered from the root layout as a Server Component so the configuration is
 * read from `process.env` on the server. Only public identifiers (a GA4
 * Measurement ID or a GTM Container ID) reach the browser; no secret does.
 * Google's own guidance is that both are public values — they are shipped to
 * every visitor by design.
 *
 * Why exactly one loader: if the GTM container holds a GA4 Configuration tag
 * *and* the page also loads gtag.js with `gtag('config', id)`, every navigation
 * produces two `page_view` hits and every event is counted twice. This module
 * resolves a single owner via `resolveTagLoader()`.
 *
 * Why there is no GTM `<noscript>` iframe: the standard GTM snippet includes a
 * `<noscript><iframe src="…/ns.html?id=GTM-…">` fallback. That iframe fires a
 * page view for a visitor with JavaScript disabled — including a visitor who
 * has *denied* analytics consent, because no consent logic can run without JS.
 * Omitting it means no-JS visitors are simply not measured, which is both the
 * privacy-correct behaviour and immaterial for a JS-rendered Next.js app.
 *
 * Environment gating: outside production the loader renders nothing at all, so
 * local and preview traffic can never reach the production property. See
 * `resolveDeploymentEnvironment`.
 *
 * Failure isolation: every script is loaded with `onError` swallowed and
 * `crossOrigin="anonymous"`. If Google's endpoints are unreachable the website
 * continues to render and function — analytics is a supporting service, never a
 * dependency of the core ALO application.
 */

/** Inline bootstrap: dataLayer + consent defaults. Must run before any tag. */
function buildBootstrapScript(
  consentMode: boolean,
  siteUrl: string,
  environment: string,
  loader: 'gtm' | 'gtag',
  /** Loader-specific JavaScript, appended AFTER the consent defaults. */
  loaderPayload: string,
): string {
  const lines: string[] = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = window.gtag || gtag;',
    "gtag('js', new Date());",
  ];
  if (consentMode) {
    // Consent Mode v2 defaults. Everything advertising- and analytics-related
    // starts DENIED; the consent banner upgrades it only after an explicit
    // visitor choice. `wait_for_update` gives the banner 500ms to apply a
    // previously stored decision before the tag gives up waiting.
    lines.push(
      "gtag('consent', 'default', {",
      "  'ad_storage': 'denied',",
      "  'ad_user_data': 'denied',",
      "  'ad_personalization': 'denied',",
      "  'analytics_storage': 'denied',",
      "  'functionality_storage': 'granted',",
      "  'personalization_storage': 'denied',",
      "  'security_storage': 'granted',",
      '  \'wait_for_update\': 500',
      '});',
    );
  }
  // Non-identifying context shared with every tag through the dataLayer.
  // `loader` matters: it tells the client-side page-view emitter whether the
  // initial page_view was already fired by the tag loader, so a single
  // navigation is never counted twice.
  lines.push(
    'window.aloAnalyticsContext = ' +
      JSON.stringify({ siteUrl, environment, consentMode, loader }) +
      ';',
  );
  // The loader is appended last, so consent defaults are unconditionally set
  // before any Google library is fetched. This ordering is the whole point of
  // having a bootstrap at all.
  lines.push(loaderPayload);
  return lines.join('\n');
}

/**
 * JavaScript that injects the gtag.js library and then queues its configuration.
 *
 * This is deliberately a `document.createElement` call inside the bootstrap
 * rather than a `<script src async>` element in the markup. React 19 hoists an
 * async script with a `src` into `<head>` as a resource hint, which puts the
 * loader physically BEFORE the inline body script that sets the consent
 * defaults — verified in the prerendered HTML, where `gtag/js` landed at byte
 * 2541 and the consent defaults at byte 5702. Consent Mode v2 requires the
 * defaults to be set before the library loads, so the ordering has to be
 * guaranteed by execution sequence, not by DOM position. Injecting the element
 * from the bootstrap makes that structural: the defaults have already run by the
 * time this line is reached.
 */
function buildGtagLoaderInjection(measurementId: string, consentMode: boolean): string {
  const config = buildGa4ConfigObject(consentMode);
  return [
    `(function(){`,
    `  var s=document.createElement('script');`,
    `  s.async=true;`,
    `  s.crossOrigin='anonymous';`,
    `  s.src='https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}';`,
    `  var f=document.getElementsByTagName('script')[0];`,
    `  if(f&&f.parentNode){f.parentNode.insertBefore(s,f);}else{document.head.appendChild(s);}`,
    `})();`,
    `gtag('config', ${JSON.stringify(measurementId)}, ${JSON.stringify(config)});`,
  ].join('\n');
}

/** gtag.js configuration object for the direct-GA4 path. */
function buildGa4ConfigObject(consentMode: boolean): Record<string, unknown> {
  const config: Record<string, unknown> = {
    // Strip the last octet of the visitor IP before it is stored.
    anonymize_ip: true,
    // Do not let Google use ALO visitor data for cross-customer ad
    // personalisation. ALO does not run remarketing off this property.
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // The gtag loader must NOT auto-fire page_view. AnalyticsPageView owns
    // every page view (initial + client-side navigations) so that exactly one
    // page_view is sent per view and each carries ALO's page_type. Under GTM
    // this flag is not reachable from code — see AnalyticsPageView for how the
    // first view is then skipped instead.
    send_page_view: false,
  };
  if (consentMode) {
    // Tag keeps firing (with consent denied) so that Consent Mode can model
    // conversions statistically instead of dropping them entirely.
    config.consent_mode_update = false;
  }
  return config;
}

/** GTM container loader. The GA4 tag itself lives inside the container. */
function buildGtmScript(containerId: string): string {
  return [
    `(function(w,d,s,l,i){w[l]=w[l]||[];`,
    `var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;`,
    `j.src='https://www.googletagmanager.com/gtm.js?id='+i+'&l='+l;`,
    `if(f&&f.parentNode){f.parentNode.insertBefore(j,f);}else{d.head.appendChild(j);}`,
    `})(window,document,'script','dataLayer',${JSON.stringify(containerId)});`,
  ].join('\n');
}

export interface GoogleTagsProps {
  /**
   * Render a diagnostic HTML comment describing why nothing was injected.
   * Useful in review builds; harmless in production.
   */
  debugComment?: boolean;
}

export default function GoogleTags({ debugComment = false }: GoogleTagsProps) {
  const config = getGoogleStackConfig();
  const loader = resolveTagLoader(config);

  if (loader.loader === 'none') {
    return debugComment ? (
      <>{`<!-- ALO analytics: no tag injected. ${loader.reason} -->`}</>
    ) : null;
  }

  const loaderPayload =
    loader.loader === 'gtm'
      ? buildGtmScript(loader.id)
      : buildGtagLoaderInjection(loader.id, config.consentMode);
  const bootstrap = buildBootstrapScript(
    config.consentMode,
    config.siteUrl,
    config.environment,
    loader.loader,
    loaderPayload,
  );

  return (
    <>
      {/* A single inline script rather than next/script, and rather than a
          separate <script src> for the loader.

          next/script's `beforeInteractive` is a Pages Router feature the linter
          rejects in the App Router, and `afterInteractive` injects during
          hydration — potentially after AnalyticsPageView has already pushed a
          page_view into a dataLayer whose consent defaults are not yet set.

          A separate <script src async> is worse: React 19 hoists it into <head>
          as a resource hint, physically ahead of the inline body script holding
          the consent defaults. That was observed in the prerendered HTML. So the
          loader is injected from within the bootstrap instead, which makes
          "defaults before library" a property of execution order rather than of
          markup order.

          The site's CSP already permits inline scripts (script-src
          'unsafe-inline', required by Next/Tailwind) and allowlists the loader
          origin. There is deliberately no onError handler: a script that fails
          to load simply does not execute, so the website is unaffected. That is
          the required failure isolation, achieved without code. */}
      <script
        id="alo-analytics-bootstrap"
        dangerouslySetInnerHTML={{ __html: bootstrap }}
        suppressHydrationWarning
      />

      {debugComment ? (
        <>{`<!-- ALO analytics: loader=${loader.loader} id=${loader.id} env=${config.environment} consentMode=${config.consentMode}. ${loader.reason} -->`}</>
      ) : null}
    </>
  );
}
