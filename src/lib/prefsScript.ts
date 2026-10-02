// The storage keys and the inline <head> script that applies them before the
// first paint. No React here: app/layout.tsx (a Server Component) imports it.
export const THEME_KEY = "itd.theme";
export const LOCALE_KEY = "itd.locale";

export const PREFS_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;d.style.colorScheme=t;if(localStorage.getItem("${LOCALE_KEY}")==="hi"){d.lang="hi";d.classList.add("locale-pending");setTimeout(function(){d.classList.remove("locale-pending")},1500)}}catch(e){d.dataset.theme="light"}})()`;
