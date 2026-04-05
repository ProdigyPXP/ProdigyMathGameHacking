# PHEx Plasmo Extension

This package contains the Plasmo rewrite of PHEx.

## Development

Install workspace dependencies from the repository root:

```sh
pnpm install
```

Run extension dev mode (Chromium):

```sh
pnpm --dir extension dev
```

Run extension dev mode (Firefox MV3):

```sh
pnpm --dir extension dev:firefox
```

## Build

Build Chromium extension:

```sh
pnpm --dir extension build
```

Build Firefox MV3 extension:

```sh
pnpm --dir extension build:firefox
```