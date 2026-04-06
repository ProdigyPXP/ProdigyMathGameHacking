# Prodigy Origin

**Free and open source mods for [Prodigy Math Game](https://prodigygame.com).**

Prodigy Origin enhances your Prodigy Math Game experience with community-built mods, delivered through a simple browser extension.

> **Looking for Prodigy hacks?** Prodigy Origin is the ultimate open source mod loader and hack tool for Prodigy Math Game.

## Install

| Browser | Link |
|---------|------|
| Chrome | Chrome Web Store (coming soon) |
| Firefox | Firefox Add-ons (coming soon) |
| Edge | Edge Add-ons (coming soon) |
| Manual | [Manual install guides](meta/manual/) |

## Features

- Blocks the original game code and loads a patched version with mods enabled
- Removes Content Security Policy restrictions
- Injects the **Prodigy Origin** mod menu into the game
- Configurable custom game/mod bundle URLs via the extension popup
- Custom login background and logo

## Components

| Directory | Description |
|-----------|-------------|
| `extension/` | MV3 Chrome extension (Plasmo) — intercepts requests, injects mods |
| `originGUI/` | In-game mod menu (esbuild) — TypeScript + SCSS |
| `typings/` | Reverse-engineered TypeScript types for Prodigy game objects |
| `meta/` | Documentation and install guides |

## Development

```bash
# Install all workspace dependencies
pnpm install

# Build the mod menu
cd originGUI && pnpm build

# Build the extension
cd extension && pnpm build

# Dev mode (extension hot reload)
cd extension && pnpm dev
```

Load the unpacked extension from `extension/build/chrome-mv3-dev/` in Chrome.

Navigate to [math.prodigygame.com](https://math.prodigygame.com/) — press **SHIFT** to toggle the mod menu.

## License

[Mozilla Public License 2.0](LICENSE.txt)

## Links

- [Discord](https://dsc.gg/ProdigyPXP)
- [GitHub](https://github.com/ProdigyPXP/ProdigyMathGameHacking)
