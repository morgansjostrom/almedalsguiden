export type PaymentsEnv = "sandbox" | "live";

// Preview/dev hosts use test payments; the published site uses live payments.
export function paymentsEnvForHost(host: string): PaymentsEnv {
  return /(^|\.)localhost(:\d+)?$|^id-preview--|^preview--|-dev\.lovable\.app$|lovableproject\.com$/.test(host)
    ? "sandbox"
    : "live";
}

export const ORGANIZER_PRICE_ID = "arrangorspaket_arlig";
