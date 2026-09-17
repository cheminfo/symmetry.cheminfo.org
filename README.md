# SymmeTry

Find the symmetry of a molecule, a crystal or a pattern. Assign a point group
one flowchart question at a time, watch each operation act on the structure in
3D, build a cell in any of the 230 space groups, and name the plane group of a
repeating pattern.

Everything runs in the browser. There is no backend, no service to call, and
nothing you draw or drop is uploaded — the 230 space groups, the
53 point groups, the 41 character tables and the 56 molecules are compiled into
the bundle.

<https://symmetry.cheminfo.org>

## The pages

| Address                  | What it is                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| `/`                      | the molecule workbench: pick a molecule, get its point group in 3D       |
| `/crystals`              | the crystal workbench: a cell in any of the 230 space groups             |
| `/plane`                 | the plane workbench: a motif repeated under a wallpaper or frieze group  |
| `/tutorial`              | eighteen guided steps, from a mirror plane to a space group              |
| `/tutorial/<step>`       | one step, e.g. `/tutorial/glide-and-screw`                               |
| `/exercises`             | twenty-nine checked exercises, with hints and an answer                  |
| `/exercises/<id>`        | one exercise, e.g. `/exercises/point-group-water`                        |
| `/cheatsheet`            | the printable reference, two sides                                       |
| `/point-groups`          | the catalogue of the 53 point groups                                     |
| `/point-groups/<slug>`   | one group, e.g. `/point-groups/c2v`; the linear two are `cinfv`, `dinfh` |
| `/space-groups`          | the catalogue of the 230 space groups                                    |
| `/space-groups/<number>` | one group by its International Tables number, e.g. `/space-groups/225`   |
| `/wallpaper`             | the catalogue of the 17 wallpaper groups                                 |
| `/wallpaper/<id>`        | one group, e.g. `/wallpaper/p4g`                                         |
| `/frieze`                | the catalogue of the 7 frieze groups                                     |
| `/frieze/<id>`           | one group, e.g. `/frieze/p2mg`                                           |
| `/about`                 | what the tool computes, what it borrows, and how to cite it              |

The bar carries the first six; the four catalogues are addresses of their own,
linked from the tool. A space group is addressed by its **number** — its 521
settings are carried in `?setting=`, so 230 pages are indexed rather than 521.

Wallpaper and frieze are **separate namespaces**: `p1`, `p2` and `p1m1` each
name a different group in the two sets, so `/wallpaper/p2` and `/frieze/p2` are
two pages.

An id the site does not know lands on its own catalogue index rather than on the
home page, so a link from a slide of last year still lands in the right section.

## Link parameters

Every parameter is optional, every number is clamped, and every unreadable value
is ignored rather than fatal — these addresses are hand-edited into lecture
slides.

| Parameter    | Pages                            | Value                                                                                                                                                                                  |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `molecule`   | `/`                              | a library id, e.g. `ammonia`; up to 64 characters                                                                                                                                      |
| `operation`  | `/`                              | the label the operation list shows, e.g. `C2`, `σv(xz)`, `S4(z)`; up to 32 characters, which holds every name the library produces                                                     |
| `spaceGroup` | `/crystals`                      | 1 to 230, clamped. Named beside `structure` it wins, which is how a link asks for the same atoms in another group; left out, a named structure brings its own group, and 225 otherwise |
| `setting`    | `/crystals`, `/space-groups/<n>` | which setting of that group, 0 to 31 clamped; a number past the end of the group's own list falls back to its first                                                                    |
| `structure`  | `/crystals`                      | one of the 16 shipped structures, e.g. `quartz`; up to 64 characters                                                                                                                   |
| `supercell`  | `/crystals`                      | cells drawn along each axis, 1 to 4 clamped; 1 by default                                                                                                                              |
| `planeGroup` | `/plane`                         | a wallpaper or frieze id, e.g. `p4g`; up to 12 characters; `p4m` by default                                                                                                            |
| `motif`      | `/plane`                         | `comma`, `flag`, `step`, `wedge`, or a drawn polygon as `d:…`; up to 64 characters                                                                                                     |
| `tiles`      | `/plane`                         | cells repeated along each direction, 1 to 10 clamped; 4 by default                                                                                                                     |
| `flags`      | every page that draws layers     | the layers that are on, comma-separated, or `none` — see **Layers**                                                                                                                    |
| `embed`      | all                              | present (`?embed` or `?embed=1`) drops the site chrome — see **Embedding**                                                                                                             |
| `hide`       | all                              | comma-separated regions to leave out — see **Embedding**                                                                                                                               |

Editing the cell, the atoms or the group on `/crystals` drops `structure=` from
the address: a link naming `halite` must open halite, not whatever was typed
over it. **Download CIF** is how an edited cell leaves the page.

### Layers

`flags=` pins which layers are drawn over the structure, so a shared figure is
the figure the author composed rather than whatever the reader's browser
remembers:

```
/?molecule=benzene&flags=axes,labels
```

The twelve names are `axes`, `mirrors`, `inversion`, `improper`, `orbit`,
`stereogram`, `unitCell`, `asymmetricUnit`, `glides`, `screws`,
`fundamentalDomain` and `labels`. `flags=none` draws the structure alone.
Leaving the parameter out leaves the reader's own stored layers alone, and a
link that says exactly the site defaults does not carry it at all.

## Embedding

A link on a course page is rarely the whole site: it is one figure. `?embed`
drops the header, its bar and the footer; `hide=` names the regions to leave
out. The **Share** button in the header composes both the link and the
`<iframe>` for what is on screen.

```
/?molecule=ammonia&operation=C3&embed=1&hide=picker,flowchart,characters
```

opens ammonia with its C₃ axis and its three mirror planes drawn, plays the C₃
the link names, and leaves out the library, the flowchart and the character
table — so the figure is the 3D view, its operation list and its layer chips,
and nothing a visitor could use to replace the molecule.

```html
<iframe
  src="https://symmetry.cheminfo.org/?molecule=ammonia&operation=C3&embed=1&hide=picker,flowchart,characters"
  title="Ammonia, C3v — SymmeTry"
  width="100%"
  height="700"
  style="border: 1px solid #ddd; border-radius: 8px"
  loading="lazy"
></iframe>
```

The eighteen regions are `tabs`, `intro`, `picker`, `flowchart`, `operations`,
`characters`, `controls`, `cell`, `positions`, `motif`, `catalogue`, `export`,
`steps`, `text`, `demos`, `list`, `hints` and `solution`. Which apply depends on
the page — the share dialog only offers the ones it has, and a name it does not
know is ignored rather than fatal. The dialog opens with `intro`, `catalogue`
and `export` already switched off, whichever of them the open page has.

`motif` is both a parameter and a region: `motif=comma` says which motif is
repeated, `hide=motif` drops the editor that would let a visitor change it.

A hidden region is dropped from the React tree rather than hidden with CSS, so
an embedded figure never builds a panel nobody will see. The tool stays fully
usable with no `localStorage`, which is what a third-party frame often gets.

## Where the numbers come from

- **The 230 space groups** — 521 settings and their 7244 general positions,
  extracted from cheminfo's own crystallography view and checked against the
  International Tables for Crystallography, volume A.
  `node scripts/generateSpaceGroups.ts` compiles them into
  `src/data/spaceGroupRows.ts`. Crystal system, Laue class, unique axis, and
  whether a group is centrosymmetric, Sohncke or symmorphic are **derived from
  the operations**, never typed: 92 centrosymmetric, 65 Sohncke, 73 symmorphic,
  32 crystal classes. Every operation prints back byte for byte, which is a
  test, not a claim.
- **No Wyckoff letters.** The letters are conventional and cannot be derived
  from the operation lists, so the site computes the orbit of a position
  instead and reports `multiplicity 4, site symmetry m-3m` — exact, and the
  part that is the chemistry.
- **The 53 point groups and 41 character tables** — hand-entered and checked in
  the test suite against Σd² = |G|, `#irreps = #classes` and both orthogonality
  relations, with complex conjugate pairs stored as pairs. Ten finite groups
  (`C7 C8 C7v C8v C5h D7 D8 D7h D8h D6d`) ship no table, and `C∞v` / `D∞h` have
  infinitely many irreducible representations; those pages say so.
- **The point group of a molecule** is detected from its coordinates, from
  candidate operations built out of pairs of atoms rather than guessed axes. The
  tolerance is a field of the result, which is what makes ethane at 58° read
  `D3` tightly and `D3d` loosely — the teaching case.
- **56 molecules**, each recording where its bond lengths and angles come from
  and what was idealised.
- **The 17 wallpaper and 7 frieze groups** — generators closed in the browser;
  the mirrors, glides and rotation centres on each diagram are derived from the
  operations, not drawn by hand.
- **CIF in and out** — [`cif-to-json`](https://github.com/cheminfo/cif-to-json),
  behind a façade that names the data block, repairs the quoting real files
  carry, and reads the standard uncertainty of a value.
- **The 3D** — [Mol\*](https://molstar.org).

## Development

`react-cheminfo` is depended on as the neighbouring checkout
(`file:../../react-cheminfo`) until the release carrying this site's record is
published; run `npm run tsc` there after changing it.

```console
npm install
npm run dev          # http://localhost:10917
npm run test         # vitest + type-check + token and deploy checks + eslint + prettier
npm run test-e2e     # playwright, needs a browser: npx playwright install chromium
npm run build        # prerenders one HTML file per address, plus sitemap.xml

node scripts/generateOgImage.ts     # redraw public/og.png, the card a link unfurls into
node scripts/generateSpaceGroups.ts # regenerate src/data/spaceGroupRows.ts
```

`src/symmetry/**` and `src/crystal/**` are the part that has to be right, so
they import neither React nor Mol\* and run in plain Node under vitest. Only
`src/viewer/**` imports Mol\*. Both rules are enforced by eslint.

## Deployment

```console
cp .env.example .env
# uncomment exactly one COMPOSE_FILE line, then
docker compose up -d
```

Three modes are committed: port-published (`compose.yaml`, the default), behind
Traefik (`compose.traefik.yaml`), and behind a Cloudflare Tunnel
(`compose.cloudflared.yaml`). Deployment itself — pulling, tagging, probing and
rolling back — is the global script on the server; there is none in this
repository.

### Environment

| Variable          | Used by            | What it does                                                                                        |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `COMPOSE_FILE`    | docker compose     | which deployment mode runs; unset means `compose.yaml`                                              |
| `IMAGE_NAME`      | every compose file | the published image, `ghcr.io/cheminfo/symmetry.cheminfo.org`                                       |
| `IMAGE_TAG`       | every compose file | rewritten by the server's deploy script — never edited by hand                                      |
| `PORT`            | `compose.yaml`     | host port the site is published on; the container always listens on 80                              |
| `BASE_PATH`       | every compose file | the path this deployment is mounted under, e.g. `/symmetry/`; unset serves the root of its own host |
| `TRACKING_SCRIPT` | every compose file | audience-measurement snippet, taken verbatim                                                        |
| `TUNNEL_TOKEN`    | cloudflared        | the Cloudflare Tunnel token                                                                         |

`TRACKING_SCRIPT` is injected by the container entrypoint at the end of the
`<head>` of **every** prerendered page, never at build time — so one image
serves a counted production deployment and an uncounted staging one. Unset
means nothing is loaded, which is what `npm run dev` always does.

`BASE_PATH` is stamped in by the same entrypoint, so the same image and the same
tag serve `https://symmetry.cheminfo.org/` and
`https://www.cheminfo.org/symmetry/` with nothing rebuilt.

## License

[MIT](./LICENSE)
