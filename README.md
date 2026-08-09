# Scale Body Finder

Enter a character's real-world measurements and get their true 1:6 figures, plus
the 1:6-scale seamless bodies that come closest — and the scale each of those
bodies **actually** works out to.

Live: **https://mmi-coder.github.io/scale-body-finder/**

## The idea

Scale is an **output**, not an input. You don't shrink a character to 1:6 and
hunt for something that fits — you ask what scale each body would have to be for
it to fit, and report that.

The priority measurement is the anchor:

```
scale = body[priority] / character[priority]
```

At that scale the priority matches exactly by construction, and the other two
measurements are the test of whether it holds up.

Results are **a set of options, not a ranking**. Nothing is labelled a winner.
Bodies measured by hand carry ±1mm, which is wider than most of the gaps
involved, so ordering them would be false precision.

Only bust, waist and hips decide which bodies come back. Height, underbust,
shoulder, arm and inseam are shown but never used to pick.

## Running it

```bash
npm install
npm run web       # browser
npm start         # dev server, all platforms
```

## Changing the body data

`data/bodies.csv` is the only file you edit. One row per body, millimetres
throughout, `N/A` for anything unknown.

```bash
# edit data/bodies.csv, then:
npm run data      # regenerate data/bodies.js
npm run verify    # sanity-check the engine
git add data && git commit -m "..." && git push
```

`npm run data` is wired in as a `pre` step on `start`, `web`, `ios`, `android`
and `build:web`, so local runs can't use stale data. **CI regenerates it too and
fails the deploy if the committed copy differs** — you'll get a clear error
rather than a site that quietly serves old numbers.

Two columns are load-bearing beyond the obvious:

- **`Image`** names a file in `images/`. The build reads each JPEG's real
  dimensions and bakes them into `data/bodies.js`, so cards use each photo's own
  aspect ratio. (react-native-web has no `Image.resolveAssetSource`, so this
  can't be done at runtime.)
- **`Hand Measured?`** — `Yes` puts the ±1mm badge on the card and the note in
  the CSV export.

A row missing bust, waist or hips is skipped by the matcher; a row whose image
is missing fails the build loudly.

## Images

Used **exactly as supplied** — no cropping, resizing or re-encoding. They're
manufacturer material; see [`images/CREDITS.md`](images/CREDITS.md).

## Deploying

Every push to `main` triggers `.github/workflows/deploy.yml`, which installs,
regenerates the data, checks it isn't stale, runs the engine checks, builds the
web bundle and publishes to GitHub Pages.

The repo name has to stay **`scale-body-finder`** — it's the `baseUrl` in
`app.json`. Rename one without the other and you get a blank page.

## Layout

```
app/            screens (expo-router)
Components/     themed UI, plus BodyCard
utils/          matching.js is the engine; scaleUtils.js does units and scale names
data/           bodies.csv (edit this) -> bodies.js (generated)
images/         product photos, as supplied
tools/          build-body-data.js, verify-matching.js
```
