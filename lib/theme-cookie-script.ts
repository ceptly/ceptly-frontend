import { THEME_COOKIE_NAME } from "@/lib/theme";

/** Seeds next-themes localStorage from the theme cookie before hydration. */
export const THEME_COOKIE_SEED_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]*)/);if(m)localStorage.setItem("${THEME_COOKIE_NAME}",decodeURIComponent(m[1]))}catch(e){}})();`;
