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
  return lines.join('\n');
}

/** gtag.js configuration command for the direct-GA4 path. */
function buildGa4ConfigScript(measurementId: string, consentMode: boolean): string {
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
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = window.gtag || gtag;',
    `gtag('config', ${JSON.stringify(measurementId)}, ${JSON.stringify(config)});`,
  ].join('\n');
}

/** GTM container loader. The GA4 tag itself lives inside the container. */
function buildGtmScript(containerId: string): string {
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = window.gtag || gtag;',
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

  const bootstrap = buildBootstrapScript(
    config.consentMode,
    config.siteUrl,
    config.environment,
    loader.loader,
  );

  return (
    <>
      {/* Plain script elements rather than next/script.

          next/script's `beforeInteractive` is documented for the Pages Router's
          _document and the linter warns about it here, while `afterInteractive`
          injects during hydration — potentially after AnalyticsPageView's
          effect has already pushed a page_view into a dataLayer whose consent
          defaults have not been set yet. Rendering real <script> elements
          inline guarantees the order the consent model depends on: defaults
          first, then the loader, then the configuration, all during HTML
          parsing and before React hydrates.

          The site's CSP already permits inline scripts (script-src
          'unsafe-inline', required by Next/Tailwind) and allowlists the loader
          origin. There is deliberately no onError handler: a plain script that
          fails to load simply does not execute, so the website is unaffected.
          That is the required failure isolation, achieved without code. */}
      <script
        id="alo-analytics-bootstrap"
        dangerouslySetInnerHTML={{ __html: bootstrap }}
        suppressHydrationWarning
      />

      {loader.loader === 'gtm' ? (
        <script
          id="alo-gtm-container"
          dangerouslySetInnerHTML={{ __html: buildGtmScript(loader.id) }}
          suppressHydrationWarning
        />
      ) : (
        <>
          <script
            id="alo-ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loader.id)}`}
            async
            crossOrigin="anonymous"
          />
          <script
            id="alo-ga4-config"
            dangerouslySetInnerHTML={{
              __html: buildGa4ConfigScript(loader.id, config.consentMode),
            }}
            suppressHydrationWarning
          />
        </>
      )}

      {debugComment ? (
        <>{`<!-- ALO analytics: loader=${loader.loader} id=${loader.id} env=${config.environment} consentMode=${config.consentMode}. ${loader.reason} -->`}</>
      ) : null}
    </>
  );
}
