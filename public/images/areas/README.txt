HOW TO ADD PHOTOS
=================

There is now one folder per area of service in here (hair/, nails/, dental/,
prayer-evangelism/, etc. — the folder name matches the area's id).

To add photos to an area:

  1. Start the local site:   python3 -m http.server 8788
  2. Open the area page, e.g. http://localhost:8788/index.html#/area/dental
  3. Drag photos from Downloads straight into that area's folder in Finder,
     e.g.  images/areas/dental/
  4. Reload the page. The photos appear in the "See it in action" fan.

Ordering:
  Photos show in FILENAME order. The FIRST file (alphabetically) is the
  "top" photo — it renders in front of the fan. To control the order, prefix
  filenames with numbers:  01-front.jpg, 02-kitchen.jpg, 03-team.jpg

Notes:
  - This auto-pickup works on the LOCAL server only (localhost). It reads the
    folder's directory listing, so no need to edit data.js while previewing.
  - To make the photos permanent / go live on the deployed site, they still
    need to be listed in data.js. Ask Claude to "bake the folder photos into
    data.js" (or add them by hand) before deploying.
  - Keep each photo reasonably small (resize to ~1600px, aim < 300 KB) so the
    site stays fast. Cloudflare Pages caps individual files at 25 MB.

The empty .gitkeep file in each folder just keeps the (otherwise empty) folder
tracked in git. Leave it; drop your real photos alongside it.
