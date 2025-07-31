# Acorn Design System

This repository contains the Acorn Design System from Mozilla Firefox, automatically synced from the [mozilla/firefox](https://github.com/mozilla/firefox) repository.

Acorn is Firefox's design system that provides:
- **Design tokens** in JSON format (`design-tokens.json`)
- **Modular CSS files** for different token categories
- **Build tools** for generating CSS from design tokens
- **Documentation** and examples

## Repository structure

```
acorn-design-system/
├── design-tokens.json          # Main design tokens definition
├── tokens-config.js           # Style Dictionary configuration
├── package.json               # Build dependencies
├── acorn-tokens/              # Modular token CSS files
│   ├── acorn-colors.css       # Color tokens (generated)
│   ├── acorn-typography.css   # Typography tokens (generated)
│   ├── acorn-size.css         # Size and dimension tokens (generated)
│   ├── acorn-space.css        # Spacing tokens (generated)
│   ├── acorn-borders.css      # Border tokens (generated)
│   ├── acorn-shadows.css      # Shadow tokens (generated)
│   └── acorn-inputs.css       # Input/form tokens (generated)
└── acorn-utils/               # Custom Acorn utilities
    └── text-and-typography.css # Additional typography utilities
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

You can use the modular CSS files in your projects:

```html
<!-- Use specific token categories -->
<link rel="stylesheet" href="acorn-tokens/acorn-colors.css">
<link rel="stylesheet" href="acorn-tokens/acorn-typography.css">
<link rel="stylesheet" href="acorn-tokens/acorn-size.css">
```

### CSS token files

| File | Description |
|------|-------------|
| `acorn-tokens/acorn-colors.css` | All color-related tokens (backgrounds, borders, text, icons, etc.) |
| `acorn-tokens/acorn-typography.css` | Font sizes, weights, and heading styles |
| `acorn-tokens/acorn-size.css` | Dimensions, icon sizes, and layout measurements |
| `acorn-tokens/acorn-space.css` | Spacing, padding, and margin tokens |
| `acorn-tokens/acorn-borders.css` | Border widths, radii, and styles |
| `acorn-tokens/acorn-shadows.css` | Box shadow definitions |
| `acorn-tokens/acorn-inputs.css` | Form elements, buttons, and interactive components |
| `acorn-utils/text-and-typography.css` | Additional typography utilities and text-related helper classes |

### Custom utilities

The `acorn-utils/` directory contains additional CSS utilities.

```html
<!-- Include custom utilities alongside token files -->
<link rel="stylesheet" href="acorn-tokens/acorn-typography.css">
<link rel="stylesheet" href="acorn-utils/text-and-typography.css">
```

## Built with Style Dictionary

These design tokens are generated with [Style Dictionary](https://github.com/amzn/style-dictionary), an open-source tool for transforming design tokens into platform-specific code. Style Dictionary enables us to maintain design tokens in a single JSON file and generate CSS variables, documentation, and other formats automatically.

## Related links

**Acorn Design System**: [acorn.firefox.com](https://acorn.firefox.com/)

## License

This project follows the same license as the Mozilla Firefox project. See the license headers in individual files for details.

## Contributing

Since this repository is automatically synced from Firefox, contributions should be made to the original Firefox repository:

1. **For design token changes**: Contribute to [mozilla/firefox](https://github.com/mozilla/firefox)
2. **For this sync setup**: Open issues or PRs in this repository

