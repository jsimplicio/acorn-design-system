# Acorn Design System

This repository contains the Acorn Design System from Mozilla Firefox, automatically synced from the [mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox) repository.

Acorn is Firefox's design system that provides:
- **Design tokens** in JSON format (split across multiple files)
- **Web components** built with Lit
- **Modular CSS files** generated from design tokens
- **Build tools** for generating CSS from design tokens

## Repository structure

```
acorn-design-system/
├── dist/                      # Build outputs (for consumers)
│   ├── tokens/                # Generated CSS from tokens
│   │   ├── base/              # Base token CSS
│   │   └── components/        # Component token CSS
│   └── utils/                 # Utility CSS (text and typography)
├── src/
│   ├── components/            # Web components (Lit)
│   ├── tokens/                # Design token JSON sources
│   │   ├── base/              # Base tokens (color, size, space, etc.)
│   │   └── components/        # Component tokens (button, badge, etc.)
│   └── styles/
│       └── index.css          # Main CSS entry point
├── examples/
│   └── index.html             # Demo page
├── tokens-config.cjs          # Style Dictionary configuration
└── package.json               # Build dependencies
```

## Usage

### Installing dependencies

```bash
npm install
```

### Building tokens

```bash
npm run build
```

This will generate all the CSS files from the design tokens.

### Using the design system

```html
<!-- Import design tokens -->
<link rel="stylesheet" href="dist/tokens/base/color.css">
<link rel="stylesheet" href="dist/tokens/components/button.css">
<!-- Or import all tokens via the convenience file -->
<link rel="stylesheet" href="src/styles/index.css">

<!-- Use web components -->
<script type="module">
  import './src/components/button/acorn-button.js';
  import './src/components/badge/acorn-badge.js';
</script>

<acorn-button type="primary" label="Click me"></acorn-button>
<acorn-badge label="New"></acorn-badge>
```

### CSS token files

Generated CSS is organized to mirror the source JSON structure:
- `dist/tokens/base/` - Base design tokens (color, size, space, font, etc.)
- `dist/tokens/components/` - Component-specific tokens (button, badge, checkbox, etc.)
- `src/styles/index.css` - Imports all token files

## Built with Style Dictionary

These design tokens are generated with [Style Dictionary](https://github.com/amzn/style-dictionary), an open-source tool for transforming design tokens into platform-specific code. Style Dictionary enables us to maintain design tokens in a single JSON file and generate CSS variables, documentation, and other formats automatically.

## Related links

**Acorn Design System**: [acorn.firefox.com](https://acorn.firefox.com/)

## License

This project follows the same license as the Mozilla Firefox project. See the license headers in individual files for details.

## Contributing

Since this repository is automatically synced from Firefox, contributions should be made to the original Firefox repository:

1. **For design token changes**: Contribute to [mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox)
2. **For this sync setup**: Open issues or PRs in this repository

