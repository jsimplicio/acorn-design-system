# Acorn Design System

This repository contains the Acorn Design System from Mozilla Firefox, automatically synced from the [mozilla/gecko-dev](https://github.com/mozilla/gecko-dev) repository.

## 🎨 What is Acorn?

Acorn is Firefox's design system that provides:
- **Design tokens** in JSON format (`design-tokens.json`)
- **Modular CSS files** for different token categories
- **Build tools** for generating CSS from design tokens
- **Documentation** and examples

## 📁 Repository Structure

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
├── docs/                      # Documentation and examples
└── tests/                     # Token validation tests
```

## 🔄 Automatic Sync

This repository is automatically kept in sync with Firefox's design system through a GitHub Action that:

- **Runs daily** at 6 AM UTC to check for changes
- **Compares** the current repository with the latest Firefox code
- **Automatically syncs** any changes found
- **Creates commits** with references to the source Firefox commits
- **Can be triggered manually** via the GitHub Actions UI

### Manual Sync

You can also manually trigger a sync by:
1. Going to the **Actions** tab in this repository
2. Selecting the **"Sync from Firefox Repository"** workflow
3. Clicking **"Run workflow"**

## 🛠️ Usage

### Installing Dependencies

```bash
npm install
```

### Building Tokens

```bash
npm run build
```

This will generate all the CSS files from the design tokens.

### Using the Design System

You can use the modular CSS files in your projects:

```html
<!-- Use specific token categories -->
<link rel="stylesheet" href="acorn-tokens/acorn-colors.css">
<link rel="stylesheet" href="acorn-tokens/acorn-typography.css">
<link rel="stylesheet" href="acorn-tokens/acorn-size.css">
```

### Available CSS Files

| File | Description |
|------|-------------|
| `acorn-tokens/acorn-colors.css` | All color-related tokens (backgrounds, borders, text, icons, etc.) |
| `acorn-tokens/acorn-typography.css` | Font sizes, weights, and heading styles |
| `acorn-tokens/acorn-size.css` | Dimensions, icon sizes, and layout measurements |
| `acorn-tokens/acorn-space.css` | Spacing, padding, and margin tokens |
| `acorn-tokens/acorn-borders.css` | Border widths, radii, and styles |
| `acorn-tokens/acorn-shadows.css` | Box shadow definitions |
| `acorn-tokens/acorn-inputs.css` | Form elements, buttons, and interactive components |

## 🔗 Related Links

- **Firefox Source**: [mozilla/gecko-dev](https://github.com/mozilla/gecko-dev)
- **Original Location**: `toolkit/themes/shared/design-system/`
- **Acorn Design System**: [acorn.firefox.com](https://acorn.firefox.com/)
- **Style Dictionary**: [Amazon Style Dictionary](https://amzn.github.io/style-dictionary/)

## 📝 License

This project follows the same license as the Mozilla Firefox project. See the license headers in individual files for details.

## 🤝 Contributing

Since this repository is automatically synced from Firefox, contributions should be made to the original Firefox repository:

1. **For design token changes**: Contribute to [mozilla/gecko-dev](https://github.com/mozilla/gecko-dev)
2. **For this sync setup**: Open issues or PRs in this repository

