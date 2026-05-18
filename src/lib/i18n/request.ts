import { getRequestConfig } from "next-intl/server";
import { isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested ?? "") ? requested! : "de";

  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});
