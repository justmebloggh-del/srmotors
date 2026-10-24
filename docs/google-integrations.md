# Google Search Console, Analytics & Tag Manager Setup

This project is prepared for these integrations but does not claim to be verified,
indexed or ranking until you have actually completed the steps below.

## 1. Search Console

1. Add the property for your production domain at
   https://search.google.com/search-console
2. Use the "HTML tag" verification method and copy the `content` value of the
   generated `<meta name="google-site-verification" ...>` tag.
3. Set `GOOGLE_SITE_VERIFICATION` in your production environment variables to that
   value, then add this to `src/app/layout.tsx`'s `metadata` export:
   ```ts
   verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
   ```
4. Once deployed, submit `https://<your-domain>/sitemap.xml` under Sitemaps in Search
   Console.

## 2. Google Analytics 4

1. Create a GA4 property and Web data stream, copy the Measurement ID
   (`G-XXXXXXXXXX`).
2. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in your environment variables.
3. Add the GA4 script to the root layout (only when the env var is set, and only with
   appropriate consent handling for your target audience — Ghana does not currently
   require a cookie-consent banner by law, but add one if SR Motors wants to be
   conservative or expands to markets that do):
   ```tsx
   {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
     <>
       <Script
         src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
         strategy="afterInteractive"
       />
       <Script id="ga4-init" strategy="afterInteractive">
         {`window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
           gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
       </Script>
     </>
   )}
   ```

## 3. Google Tag Manager (optional, only if requested)

Follow the same pattern as GA4 — gate the GTM snippet behind an env var so it is never
injected in local/dev environments by accident.

## 4. Google Business Profile

Not code-related — create/claim the listing at
https://business.google.com using SR Motors' real address and verified phone number.
Link to the website URL once live. Do not publish fabricated hours, ratings or reviews
on the site itself; structured data in this project never invents these.

## 5. PageSpeed / performance monitoring

Run https://pagespeed.web.dev against the production URL after deployment. No code
changes are required to use it — it's a point-in-time external check.
