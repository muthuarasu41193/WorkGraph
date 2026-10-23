import Script from "next/script";

const THEME_BOOT = `(function(){try{var s=localStorage.getItem("wg-theme")||localStorage.getItem("wg-profile-theme");var mode=s==="dark"||s==="light"||s==="system"?s:"system";var dark=mode==="dark"||(mode!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;if(mode==="system"){e.removeAttribute("data-theme");}else{e.setAttribute("data-theme",mode);}e.classList.toggle("dark",dark);e.style.colorScheme=dark?"dark":"light";}catch(err){}})();`;

export function ThemeScript() {
  return (
    <Script id="wg-theme-boot" strategy="beforeInteractive">
      {THEME_BOOT}
    </Script>
  );
}
