# Traço Feito — web

Next.js front end for Traço Feito. It talks to the API over HTTP only
(`API_URL`, default `http://localhost:4000`, proxied at `/api`).

```sh
npm install
npm run dev     # http://localhost:3000
npm test
npm run lint
npm run build
```

## Independence

- This repository builds, tests and lints on its own. No sibling repository
  is needed, and nothing here imports from outside the repository root.
- `lib/shared` is a UX-only mirror owned by this repo: it gives instant block
  validation in the editor and a live plan price preview. It is advisory.
- The API is the authority. Its response is always final: a block the API
  rejects is shown as rejected, and the amount charged and shown at checkout
  is the one the API returns.
- There is no duty to track the API's code. If the preview drifts from the
  API's rules, update `lib/shared` when convenient; nothing breaks meanwhile.
