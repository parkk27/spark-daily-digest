/** @deprecated Use `@/config` instead. Kept as a compatibility shim. */
export { APP_URL, appUrl } from "@/config";
import { APP_URL } from "@/config";

export const appOrigin = (): string => APP_URL;
