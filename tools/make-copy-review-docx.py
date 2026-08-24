#!/usr/bin/env python3
"""Builds the Word (.docx) copy-review packets — one per area.

    node tools/make-copy-review.mjs        # writes copy-review/areas.json
    python3 tools/make-copy-review-docx.py # writes copy-review/docx/<area>.docx

Reads copy-review/areas.json (generated from data.js), so the Word packets can't
drift from the site. Never hand-edit a .docx — regenerate them.

We write minimal OOXML by hand rather than using python-docx, whose default
template drags in a 438KB stylesWithEffects.xml and bloats every file to ~38KB.
These come out around 3KB, which matters because they get base64'd into email
attachments. No third-party dependencies.
"""

import json
import pathlib
import zipfile
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "copy-review" / "areas.json"
OUT = ROOT / "copy-review" / "docx"

ORANGE = "C15F3F"  # the site's --orange-deep
GREY = "6F6960"
INK = "161412"

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

STYLES = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles {W}>
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="{INK}"/>
</w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>"""


def doc_rels(url):
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rIdLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{escape(url)}" TargetMode="External"/>
</Relationships>"""


def run(text, *, bold=False, italic=False, size=22, color=INK, underline=False):
    props = ""
    if bold:
        props += "<w:b/>"
    if italic:
        props += "<w:i/>"
    if underline:
        props += '<w:u w:val="single"/>'
    props += f'<w:sz w:val="{size}"/><w:color w:val="{color}"/>'
    return (
        f"<w:r><w:rPr>{props}</w:rPr>"
        f'<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'
    )


def para(runs, *, before=0, after=120, indent=0):
    spacing = f'<w:spacing w:before="{before}" w:after="{after}"/>'
    ind = f'<w:ind w:left="{indent}"/>' if indent else ""
    return f"<w:p><w:pPr>{spacing}{ind}</w:pPr>{''.join(runs)}</w:p>"


def heading(text):
    return para([run(text.upper(), bold=True, size=22, color=ORANGE)], before=320, after=40)


def hint(text):
    return para([run(text, italic=True, size=18, color=GREY)], after=120)


def meta(label, value):
    return para([run(f"{label}: ", bold=True, size=20), run(value, size=20)], after=0)


def bullet(text, *, placeholder=False):
    """A '•' + tab paragraph. Editable and addable by hand, and it avoids
    pulling numbering.xml into the package."""
    body = run("•\t" + text, italic=placeholder, color=GREY if placeholder else INK)
    return para([body], after=60, indent=360)


def table(rows):
    borders = "".join(
        f'<w:{e} w:val="single" w:sz="4" w:color="DDDDDD"/>'
        for e in ("top", "left", "bottom", "right", "insideH", "insideV")
    )
    out = [f"<w:tbl><w:tblPr><w:tblBorders>{borders}</w:tblBorders></w:tblPr>"]
    for day, time in rows:
        cells = "".join(
            f'<w:tc><w:tcPr><w:tcW w:w="{w}" w:type="dxa"/></w:tcPr>'
            f"{para([run(txt, bold=b, size=20)], after=0)}</w:tc>"
            for w, txt, b in ((2600, day, True), (5000, time, False))
        )
        out.append(f"<w:tr>{cells}</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def build_document(a, year):
    p = []
    p.append(para([run(f"BlessFest {year} — Copy Review", bold=True, size=20, color=GREY)], after=0))
    p.append(para([run(a["name"], bold=True, size=52)], after=160))

    p.append(meta("Lead", a["lead"] or "(not yet assigned)"))
    if a["oversight"]:
        p.append(meta("Reports to", a["oversight"]))
    if a["location"]:
        p.append(meta("Location", a["location"]))
    if a["staffedBy"]:
        p.append(meta("Fully staffed by", f"{a['staffedBy']} — no volunteer sign-up"))

    p.append(
        para(
            [
                run(
                    f"Below is the wording that appears on the {a['name']} page of the BlessFest "
                    "website. Please read it over, fix anything that's wrong, and add anything "
                    "that's missing — then send it back. Type your changes directly into this "
                    "document; don't worry about formatting, just get the words right and we'll "
                    "handle the rest."
                )
            ],
            before=240,
        )
    )

    link = (
        f'<w:hyperlink r:id="rIdLink">'
        f'{run(a["url"], size=20, color=ORANGE, underline=True)}</w:hyperlink>'
    )
    p.append(para([run("See the page as it looks today: ", size=20), link]))

    staffed = bool(a["staffedBy"])
    n = 1

    p.append(heading(f"{n}. One-line description"))
    p.append(hint("The single sentence shown on the area's card on the homepage."))
    p.append(para([run(a["tagline"])]))
    n += 1

    p.append(heading(f"{n}. Summary paragraph"))
    p.append(hint("The short paragraph at the top of the area's page."))
    p.append(para([run(a["summary"])]))
    n += 1

    def bullets(items):
        if not items:
            return [bullet("(nothing listed yet — add anything that applies, or delete this line)",
                           placeholder=True)]
        return [bullet(i) for i in items]

    if staffed:
        p.append(heading(f"{n}. Who runs this area"))
        p.append(hint("This area is fully staffed by a partner, so the page does NOT ask for "
                      "volunteers. Correct anything wrong about who provides it and how they "
                      "should be named."))
        p.append(para([run(a["staffedNote"])]))
        n += 1
    else:
        p.append(heading(f"{n}. What you'll do"))
        p.append(hint("What a volunteer will actually be doing. Add, remove, or reword freely."))
        p.extend(bullets(a["whatYoullDo"]))
        n += 1

        p.append(heading(f"{n}. What we need"))
        p.append(hint("The kinds of volunteers or skills you're looking for."))
        p.extend(bullets(a["needs"]))
        n += 1

    p.append(heading(f"{n}. Requirements / good to know"))
    p.append(hint("Licenses, background checks, dress code, physical limits. Leave blank if none."))
    p.extend(bullets(a["requirements"]))
    n += 1

    p.append(heading(f"{n}. Shift times"))
    p.append(hint("FOR REFERENCE — please don't edit here. If these are wrong, say so at the bottom."))
    p.append(table([(c["day"], c["time"]) for c in a["commitment"]]))
    n += 1

    p.append(heading(f"{n}. Anything else?"))
    p.append(hint("Missing shifts, a photo you'd like used, a correction to a name, or anything "
                  "the page should say that it doesn't. Write it here:"))
    p.extend(para([run("")]) for _ in range(4))

    p.append(para([run("Thanks! — Send this back to Christian.", italic=True, size=20, color=GREY)],
                  before=240))

    sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr>'
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f"<w:document {W} {R}><w:body>{''.join(p)}{sect}</w:body></w:document>"
    )


def main():
    data = json.loads(SRC.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.docx"):
        old.unlink()

    for a in data["areas"]:
        path = OUT / f"{a['id']}.docx"
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", CONTENT_TYPES)
            z.writestr("_rels/.rels", ROOT_RELS)
            z.writestr("word/_rels/document.xml.rels", doc_rels(a["url"]))
            z.writestr("word/styles.xml", STYLES)
            z.writestr("word/document.xml", build_document(a, data["year"]))

    sizes = [(OUT / f"{a['id']}.docx").stat().st_size for a in data["areas"]]
    print(f"Wrote {len(sizes)} .docx to copy-review/docx/ "
          f"(avg {sum(sizes)//len(sizes)//1024 or 1}KB, max {max(sizes)//1024 or 1}KB)")


if __name__ == "__main__":
    main()
