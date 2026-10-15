"use client";

import Script from "next/script";

/**
 * Microsoft Clarity, loaded lazily and only when configured.
 * No-op until the owner creates the Clarity project and sets
 * NEXT_PUBLIC_CLARITY_PROJECT_ID in Vercel.
 */
export function Clarity({ clarityId }: { clarityId?: string }) {
  if (!clarityId || !/^[a-z0-9]+$/i.test(clarityId)) return null;

  return (
    <Script id="clarity-init" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
    </Script>
  );
}
