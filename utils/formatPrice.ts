import { clientConfig } from "@/config/client.config";

export function formatPrice(
  amount: number,
  currency = clientConfig.locale.currency,
  locale = clientConfig.locale.currencyLocale,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}