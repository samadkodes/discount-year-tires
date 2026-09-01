DISCOUNT YEAR NEW & USED TIRES — REFINED BUILD
==============================================

FILES TO UPLOAD
  index.html        The site
  styles.css        Design system (one file, commented by section)
  script.js         All interactions (no dependencies)
  assets/           Your logo + favicons, exported at several sizes
  site.webmanifest  Home-screen icon details for phones
  robots.txt        SEO
  sitemap.xml       SEO

  preview.html      NOT for upload. A single self-contained copy you can
                    double-click to view locally. Regenerate it only if you
                    change the three files above.

Upload everything except preview.html to your hosting root, keeping the
assets/ folder alongside index.html.


YOUR LOGO
  The official logo you supplied is now used everywhere the old placeholder
  mark appeared — navbar, footer, favicon, social preview, and search-result
  structured data. It was not redrawn or recreated: the white background was
  removed from your original file and the exact artwork was exported at
  several sizes.

  assets/logo-300/400/600/1200.png   full lockup, transparent background
  assets/logo-*.webp                 same images, ~4x smaller for modern browsers
  assets/mark-32/180/192/512.png     the tire emblem alone, for favicons and
                                     phone home-screen icons

  To swap the logo later, replace these files keeping the same names and
  proportions (the lockup is 2.41:1).


BEFORE PUBLISHING — REQUIRED
  1. DONE - the business phone number (713) 393-7538 is now set everywhere:
     header, contact section, footer, mobile menu, floating buttons, mobile
     action bar, and structured data, as clickable tel:+17133937538 links.
     (If the number ever changes, update it in index/about/blog HTML and the
     SHOP_PHONE / WHATSAPP_NUMBER constants at the top of script.js.)
  2. Update the opening hours in the Contact section AND the matching
     openingHoursSpecification in the structured data at the top of
     index.html. They currently hold placeholder hours.
  3. Replace the sample reviews with real ones.
  4. Confirm or correct the four numbers in the orange stats band.
  5. Update "https://www.discountyeartires.com" in index.html, robots.txt and
     sitemap.xml once the real domain is known.
  6. Add the real Facebook and Instagram URLs in the footer (currently "#").
  7. Paste your Web3Forms access key into script.js (see "Quote form" below)
     so enquiries arrive by email.
  8. The blog article dates are intentionally omitted so the content never
     looks stale. Add publish dates later only if you plan to keep posting.


WHAT THE CUSTOM CURSOR DOES
  On desktop only, the mouse pointer becomes a rolling tire. It rotates in the
  direction you move, bounces when you click, and grows with a ring when it
  passes over a button or link. It turns itself off automatically on phones and
  tablets, and for anyone whose system is set to reduce motion.


ACCESSIBILITY NOTES
  · Every interactive element is at least 44x44px on touch screens.
  · All body text meets WCAG AA contrast; most is AAA.
  · Full keyboard navigation with a visible focus ring, and a skip link.
  · "Reduce motion" is fully respected: ambient animation stops, the custom
    cursor is disabled, and nothing is left stuck mid-animation.


TIRE DECODER — WHAT IT ACCEPTS
  The decoder reads the full marking as moulded on a sidewall:

        [class] width / aspect [construction] rim [load] [speed]
           P      225  /   65        R          17    98      T

  All of these work:
        225/65R17          plain metric
        P225/65R17 98T     with class, load index and speed rating
        LT265/70R17        light truck        ST205/75R15   trailer
        T125/70R16         temporary spare    225-65R17     dash separator
        225/65-17          construction letter omitted
        225/45ZR17 94Y     Z-rated high performance
        225/65R17.5        half-inch rim

  It also range-checks the numbers, so a typo like 999/65R17 is caught with a
  message explaining which number looks wrong rather than a generic error.


WHAT'S NEW IN THIS VERSION
  - About page               about.html
  - Blog index + 5 articles  blog/
  - Quote form now emails the shop via Web3Forms (see setup below)
  Existing pages are visually unchanged - only two new items (About, Blog)
  were added to the navigation and footer.


QUOTE FORM - EMAIL (Web3Forms)
  The quote form is fully configured and live. When a customer submits it, the
  enquiry is sent straight to the shop's inbox through Web3Forms using fetch() -
  the access key is already in place at the top of section 14 in script.js.

  On success the customer sees:
      "Thank you! Your quote request has been sent successfully."
  On failure they see a clear error asking them to try again or call.

  The form submits ONLY through Web3Forms - there is no SMS or email-app
  fallback, and it never redirects the customer anywhere.

  To change the destination email later, log in at web3forms.com with the email
  the key belongs to, or generate a new key and replace WEB3FORMS_KEY in
  script.js.


TIRE PRODUCT FINDER (inventory search)
  The tire decoder is now also a product finder. When a customer enters a valid
  size and decodes it, the site searches the inventory and shows matching tires
  as cards (brand, model, size, price, availability, description) with
  "Request quote" and "Call now" buttons. Request quote prefills the quote form
  with the chosen tire so the customer doesn't retype anything, and the email
  that reaches the shop includes the selected brand, model, size and price.

  THE INVENTORY  (inventory.json)
  All tires live in inventory.json, a plain list of records. To add, remove or
  reprice a tire, edit this file and re-upload it - no code changes needed.
  Each record has: id, brand, model, width, aspect, rim, loadIndex,
  speedRating, season, seasonLabel, price, currency, stock
  (in-stock | low-stock | order-in), condition (new | used), image, description.
  Sample data covers Michelin, Bridgestone, Goodyear, Continental, Pirelli,
  Yokohama, Toyo and Falken across common sizes.

  MOVING TO A REAL BACKEND LATER  (FastAPI + PostgreSQL)
  The frontend fetches tires from ONE place: data.js. To switch from the JSON
  file to a live API, open data.js and change one line at the top:
      const DATA_SOURCE = 'inventory.json';
  to your endpoint, e.g.:
      const DATA_SOURCE = '/api/tires';
  As long as the endpoint returns the same shape ({ "tires": [ ... ] } or a
  bare array of the same records), nothing else in the site has to change. If
  you'd rather the backend do the filtering, also set SEARCH_ON_SERVER = true
  and it will call DATA_SOURCE?width=..&aspect=..&rim=.. instead.

  NOTE ON preview.html
  The finder needs to fetch inventory.json, which browsers block when a file is
  opened directly from disk (file://). So in the standalone preview.html the
  finder won't return results - that's a browser security rule, not a bug. On
  real hosting (or any local web server) it works normally. Everything else in
  preview.html behaves exactly like the live site.


TIRE PRODUCT FINDER (inventory search)
  The tire decoder is now also a product finder. When a customer enters a size
  and clicks Decode, the site searches the tire inventory and shows matching
  tires as cards (brand, model, size, price, availability, description) with
  "Request quote" and "Call now" buttons. Clicking Request quote prefills the
  quote form with that exact tire, so the customer does not retype anything, and
  the tire details are included in the email that reaches the shop.

  THE INVENTORY
    inventory.json holds the tire stock (63 sample tires across 8 brands). Each
    record has: id, brand, model, width, aspect, rim, loadIndex, speedRating,
    season, seasonLabel, price, currency, stock, condition, image, description.
    To edit stock or prices, edit inventory.json - nothing else needs touching.

  ONE PLACE TO GET DATA (future backend)
    The whole finder reads tire data through a single file, data.js. Today it
    loads inventory.json. To move to a real backend later (FastAPI + PostgreSQL),
    open data.js and change ONE line at the top:
        const DATA_SOURCE = 'inventory.json';
    to your API endpoint, e.g.:
        const DATA_SOURCE = '/api/tires';
    As long as the endpoint returns the same JSON shape ({ "tires": [ ... ] }),
    nothing else in the site has to change. If you also want the server to do
    the filtering, set SEARCH_ON_SERVER = true in the same file.

  NOTE ON THE OFFLINE PREVIEW
    preview.html is a single-file copy for quick local viewing. The product
    finder needs to fetch inventory.json, which browsers block when opening a
    file directly from disk (file://). So in preview.html the DECODER works but
    the product cards will not load. To see the finder, use the full site
    (open index.html through a web server, or just upload it to your hosting) -
    it works normally there.


REAL SHOP PHOTOS
  The site now uses real photographs of the shop, stored in assets/photos/.
  They are integrated into the existing design as backgrounds/figures with a
  dark overlay so the current white/orange text stays readable - no layout,
  colour or type changes:
    - Hero            : a customer car on fresh wheels, far behind the spinning
                        tire graphic (heavily darkened, adds depth only)
    - About page      : the real shopfront photo in the story figure
    - Inventory band  : tire-stack photo behind "The right tire. The right price."
    - Contact band    : shopfront/canopy photo behind the contact details + form
  Each photo is exported at 2-3 responsive sizes (600 / 960 / 1360px) as WebP
  and lazy-loaded, so mobile stays fast (about 650KB total for all photos, and
  only the small variants load on phones).

  To swap a photo later, replace the matching file(s) in assets/photos/ keeping
  the same filename, or edit the paths in section 31 of styles.css.


VIEWING THIS ON A PHONE
  If you open preview.html straight from Files, WhatsApp or Mail on an iPhone,
  it opens in iOS "Quick Look" - a document previewer that runs HTML with
  JavaScript switched off. The site now detects that and shows itself normally,
  but you will not see the loading animation, the tire cursor or the scroll
  effects, because those need JavaScript.

  To see the site as visitors will:
     tap the share icon, then "Open in Safari"
  or upload the files to your hosting and visit the real address.

  The site is built so that it stays usable even with JavaScript unavailable -
  all the text, the phone links, the form and the layout still work.


BROWSER SUPPORT
  Tested and working in Chrome, Edge, Firefox and Safari, on Windows, macOS,
  Android, iPhone and iPad, in both portrait and landscape.

  Section 26 of styles.css and modules 17-18 of script.js exist purely to keep
  Safari and older iOS behaving like everything else. Please don't delete
  those blocks as "redundant" - each one is commented with the specific
  problem it solves.


MAINTENANCE
  styles.css is organised into 25 numbered sections listed at the top of the
  file. Colours, spacing, type sizes and timings are all CSS variables in
  section 1 — change a value there and it updates everywhere.

  script.js is organised into 16 numbered modules, also listed at the top.
  Each one exits harmlessly if its section isn't on the page, so you can
  delete a section from the HTML without breaking anything.

  The tire graphic is inline SVG in index.html so it needs no extra download.

================================================================
TECHNICAL SEO PASS (latest update)
================================================================
The site was audited against a full technical-SEO checklist. It was
already strongly optimised from earlier work; this pass verified all
items and closed the remaining gaps.

NEW FILE:
  404.html  - Branded "Page not found" page in the site's exact design
              (same header, footer, fonts, colours, animations). Includes
              Back-to-homepage / Browse-tires / Call buttons + helpful
              links. Marked <meta robots="noindex, follow"> so the error
              page itself is not indexed but its links are followed.
              NOT listed in sitemap.xml (correct for an error page).

MODIFIED:
  All pages - Added Twitter Card meta tags (twitter:card/title/
              description/image) mirroring the existing Open Graph tags,
              for richer link previews on X/Twitter.
  sitemap.xml - Added <lastmod> dates to every URL.

VERIFIED ALREADY-CORRECT (no change needed):
  - Unique <title> + meta description on every page
  - Exactly one <h1> per page; logical H2/H3 structure
  - Canonical URLs on every page (https + www, consistent)
  - Open Graph tags on every page; og:image asset exists
  - LocalBusiness (TireShop) structured data: name, address, phone,
    geo, opening hours (matches the 8-6 / 8-5 schedule), URL, areaServed
  - No false/unsupported structured data
  - robots.txt allows all + references sitemap
  - sitemap.xml lists all 8 public pages
  - Alt text on all 19 images; no missing image paths
  - Lazy loading on below-the-fold images (footer logo, about photo);
    nav logo + hero stay eager (correct)
  - No accidental noindex on public pages; all indexable
  - All internal links resolve (zero broken)
  - No hardcoded http:// or protocol-relative resource URLs (HTTPS-ready)
  - viewport meta on every page; responsive, no mobile horizontal scroll
  - Console clean (no JS errors)

POST-DEPLOYMENT TASKS (must be done on the live server):
  1. Configure the server to serve 404.html for missing pages:
       - Apache (.htaccess):  ErrorDocument 404 /404.html
       - Nginx:               error_page 404 /404.html;
       - Netlify: automatic if 404.html is at site root
  2. Ensure HTTPS is enabled (valid TLS certificate) and force
     http -> https and non-www -> www (or whichever matches the
     canonical domain, https://www.discountyeartires.com).
  3. If any old blog URLs were shared before, add 301 redirects to
     the new URLs.

GOOGLE SEARCH CONSOLE / DOMAIN TASKS:
  1. Verify the property (https://www.discountyeartires.com).
  2. Submit sitemap.xml in Search Console.
  3. Set the preferred/canonical domain to the www + https version.
  4. Request indexing for the homepage and key pages.
  5. Add the business to Google Business Profile and keep the NAP
     (name, address, phone) identical to the LocalBusiness markup.
