import Script from "next/script";

const THEME_BOOT = `(function(){try{var s=localStorage.getItem("wg-theme")||localStorage.getItem("wg-profile-theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();`;

export function ThemeScript() {
  return (
    <Script id="wg-theme-boot" strategy="beforeInteractive">
      {THEME_BOOT}
    </Script>
  );
}
