export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event", eventName: string, params?: AnalyticsParams) => void;
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("event", eventName, params);
}

const pageStartedAt =
  typeof performance === "undefined" ? 0 : Math.round(performance.now());
let firstActionTracked = false;
let deepEngagementTracked = false;
const meaningfulActions = new Set<string>();

export function currentLayout() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

export function analyticsDestination(href: string) {
  if (href.startsWith("mailto:")) return "email";
  if (href.startsWith("/")) return href;

  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

export function trackMeaningfulAction(
  action: string,
  params: AnalyticsParams = {}
) {
  if (typeof window === "undefined") return;

  if (!firstActionTracked) {
    firstActionTracked = true;
    trackEvent("time_to_first_action", {
      action,
      elapsed_ms: Math.max(0, Math.round(performance.now()) - pageStartedAt),
      layout: currentLayout(),
      ...params,
    });
  }

  meaningfulActions.add(action);
  if (!deepEngagementTracked && meaningfulActions.size >= 3) {
    deepEngagementTracked = true;
    trackEvent("deep_engagement", {
      action_count: meaningfulActions.size,
      layout: currentLayout(),
    });
  }
}

export function startEngagementTracking() {
  if (typeof window === "undefined") return () => undefined;

  const milestones = [30, 60, 180];
  let activeSeconds = 0;
  let nextMilestone = 0;
  const interval = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;

    activeSeconds += 1;
    if (activeSeconds === milestones[nextMilestone]) {
      trackEvent("engagement_milestone", {
        active_seconds: activeSeconds,
        layout: currentLayout(),
      });
      nextMilestone += 1;
      if (nextMilestone >= milestones.length) {
        window.clearInterval(interval);
      }
    }
  }, 1_000);

  return () => window.clearInterval(interval);
}
