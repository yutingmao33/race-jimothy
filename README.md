# Race Jimothy

Draw anything and race Jimothy. A tiny Canvas game.

## Local preview

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Tests: `node regression.test.mjs` and `node sound.test.mjs`.

## GitHub Pages

Select **Settings → Pages → Source → GitHub Actions**. The included workflow tests and publishes `dist/` on each push to `main`.

Public site URL after deployment: https://tayttm.github.io/race-jimothy/

Fan-made, for fun.
