Drop past-year area photos here (optional — you can also use hosted URLs).

Naming suggestion:  <area-id>-1.jpg, <area-id>-2.jpg  (e.g. hair-1.jpg, dental-1.jpg)
Then reference them in data.js under that area's `photos` array:

    photos: [
      { src: "images/areas/hair-1.jpg", caption: "Barbers at work" },
    ],

Tips:
- Resize to about 1600px on the long edge and aim for under ~300 KB each
  (Cloudflare Pages caps individual files at 25 MB, but small = faster site).
- One photo shows large; two or more become a clickable grid + lightbox.
