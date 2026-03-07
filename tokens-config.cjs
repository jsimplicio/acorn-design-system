/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");
const { createPropertyFormatter } = StyleDictionary.formatHelpers;

const TOKEN_SECTIONS = {
  "Attention Dot": "attention-dot",
  Badge: "badge",
  "Background Color": "background-color",
  Border: "border",
  "Box Shadow": "box-shadow",
  Button: "button",
  Checkbox: "checkbox",
  Color: ["brand-color", "color", "platform-color"],
  "Focus Outline": "focus-outline",
  "Font Size": "font-size",
  "Font Weight": "font-weight",
  Dimension: "dimension",
  "Focus Outline": "focus-outline",
  "Font Size": "font-size",
  "Font Weight": "font-weight",
  Heading: "heading",
  Icon: "icon",
  "Input - Text": "input-text",
  "Input - Space": "input-space",
  Link: "link",
  "Outline Color": "outline-color",
  Page: "page",
  Promo: "promo",
  Size: "size",
  Space: "space",
  Table: ["table", "table-row"],
  Text: "text",
  Unspecified: "",
};

const TSHIRT_ORDER = [
  "circle", "xxxsmall", "xxsmall", "xsmall", "small", "medium",
  "large", "xlarge", "xxlarge", "xxxlarge",
];

const STATE_ORDER = [
  "base", "default", "root", "hover", "active", "focus", "disabled",
];

const MEDIA_QUERY_PROPERTY_MAP = {
  "forced-colors": "forcedColors",
  "prefers-contrast": "prefersContrast",
};

function formatBaseTokenNames(str) {
  // Convert both @base and default suffixes to base token names
  return str.replaceAll(/(?<tokenName>\w+)-base(?=\b)/g, "$<tokenName>")
            .replaceAll(/(?<tokenName>\w+)-default(?=\b)/g, "$<tokenName>");
}

// Helper function to check if token should be included (not platform-only)
function shouldIncludeToken(token) {
  // For simple values (not objects), include them
  if (typeof token.original.value !== 'object') {
    return true;
  }
  
  // Include tokens that have brand, shared (light/dark), or non-platform-only definitions
  const hasSharedOrBrand = token.original.value.brand ||
                          token.original.value.light ||
                          token.original.value.dark ||
                          token.original.value.default;
                          
  const isPlatformOnly = token.original.value.platform &&
                        Object.keys(token.original.value).length === 1;
                        
  return hasSharedOrBrand || !isPlatformOnly;
}

/**
 * Creates a modular CSS formatter for acorn design tokens without layers or anonymous-content-host
 * @returns {Function} - Formatter function that returns a modular CSS string.
 */
const createModularCssFormat = () => args => {
  // Custom header without layers - only license, no DO NOT EDIT comment
  let licenseString = [
    "/* This Source Code Form is subject to the terms of the Mozilla Public",
    " * License, v. 2.0. If a copy of the MPL was not distributed with this",
    " * file, You can obtain one at http://mozilla.org/MPL/2.0/. */",
  ].join("\n");
  
  let simpleHeader = licenseString + "\n\n";
  
  return formatBaseTokenNames(
    simpleHeader +
      formatSimpleTokens({
        args,
      }) +
      formatSimpleTokens({
        mediaQuery: "prefers-contrast",
        args,
      }) +
      formatSimpleTokens({
        mediaQuery: "forced-colors",
        args,
      })
  );
};

/**
 * Formats a subset of tokens into simple CSS without layers. Used for acorn-colors.css.
 *
 * @param {object} tokenArgs
 * @param {string} [tokenArgs.mediaQuery]
 *  Media query formatted CSS should be wrapped in.
 * @param {object} tokenArgs.args
 *  Formatter arguments provided by style-dictionary.
 * @returns {string} Tokens formatted into a simple CSS string.
 */
function formatSimpleTokens({ mediaQuery, args }) {
  let prop = MEDIA_QUERY_PROPERTY_MAP[mediaQuery] ?? "default";
  let dictionary = Object.assign({}, args.dictionary);
  let tokens = [];

  dictionary.allTokens.forEach(token => {
    // Try to get value from multiple sources: shared, brand, or default
    let originalVal = getOriginalTokenValue(token, prop, "");
    
    // If no shared value, try brand context for brand-specific tokens
    if (originalVal === undefined && typeof token.original.value === 'object') {
      originalVal = getOriginalTokenValue(token, prop, "brand");
    }
    
    if (originalVal != undefined) {
      let formattedToken = transformToken(
        token,
        originalVal,
        dictionary,
        ""
      );
      tokens.push(formattedToken);
    }
  });

  if (!tokens.length) {
    return "";
  }

  dictionary.allTokens = dictionary.allProperties = tokens;

  let formattedVars = formatVariables({
    format: "css",
    dictionary,
    outputReferences: args.options.outputReferences,
    formatting: {
      indentation: "  ",
    },
  });

  if (mediaQuery) {
    return `
@media (${mediaQuery}) {
  :root {
${formattedVars}
  }
}
`;
  }

  return `:root {
${formattedVars}
}
`;
}

/**
 * Finds the original value of a token for a given media query and surface.
 */
function getOriginalTokenValue(token, prop, surface) {
  if (surface) {
    return token.original.value[surface]?.[prop];
  } else if (prop == "default" && typeof token.original.value != "object") {
    return token.original.value;
  }
  return token.original.value?.[prop];
}

/**
 * Creates a light-dark transform that works for a given surface. Registers
 * the transform with style-dictionary and returns the transform's name.
 */
const createLightDarkTransform = surface => {
  let name = `lightDarkTransform/${surface}`;

  // Matcher function for determining if a token's value needs to undergo
  // a light-dark transform.
  let matcher = token => {
    if (surface != "shared") {
      return (
        token.original.value[surface]?.light &&
        token.original.value[surface]?.dark
      );
    }
    return token.original.value.light && token.original.value.dark;
  };

  // Function that uses the token's original value to create a new "default"
  // light-dark value and updates the original value object.
  let transformer = token => {
    if (surface != "shared") {
      let lightDarkVal = `light-dark(${token.original.value[surface].light}, ${token.original.value[surface].dark})`;
      token.original.value[surface].default = lightDarkVal;
      return token.value;
    }
    let value = `light-dark(${token.original.value.light}, ${token.original.value.dark})`;
    token.original.value.default = value;
    return value;
  };

  StyleDictionary.registerTransform({
    type: "value",
    transitive: true,
    name,
    matcher,
    transformer,
  });

  return name;
};

/**
 * Updates a token's value to the relevant original value after resolving
 * variable references.
 */
function transformToken(token, originalVal, dictionary, surface) {
  let value = originalVal;
  if (dictionary.usesReference(value)) {
    dictionary.getReferences(value).forEach(ref => {
      value = value.replace(`{${ref.path.join(".")}}`, `var(--${ref.name})`);
    });
  }
  
  // Ignore all comments from design-tokens.json since section headings come from TOKEN_SECTIONS
  return { ...token, value, comment: undefined };
}

/**
 * Format the tokens dictionary to a string. This mostly defers to
 * StyleDictionary.createPropertyFormatter but first it sorts the tokens based
 * on the groupings in TOKEN_SECTIONS and adds comment headers to CSS output.
 *
 * @param {object} options
 *  Options for tokens to format.
 * @param {string} options.format
 *  The format to output. Supported: "css"
 * @param {object} options.dictionary
 *  The tokens dictionary.
 * @param {string} options.outputReferences
 *  Whether to output variable references.
 * @param {object} options.formatting
 *  The formatting settings to be passed to createPropertyFormatter.
 * @returns {string} The formatted tokens.
 */
function formatVariables({ format, dictionary, outputReferences, formatting }) {
  let lastSection = [];
  let propertyFormatter = createPropertyFormatter({
    outputReferences,
    dictionary,
    format,
    formatting,
  });

  let outputParts = [];
  let remainingTokens = [...dictionary.allTokens];
  let isFirst = true;

  function tokenParts(name) {
    let lastDash = name.lastIndexOf("-");
    let suffix = name.substring(lastDash + 1);
    if (TSHIRT_ORDER.includes(suffix) || STATE_ORDER.includes(suffix)) {
      return [name.substring(0, lastDash), suffix];
    }
    return [name, ""];
  }

  for (let [label, selector] of Object.entries(TOKEN_SECTIONS)) {
    let sectionMatchers = Array.isArray(selector) ? selector : [selector];
    let sectionParts = [];

    remainingTokens = remainingTokens.filter(token => {
      if (
        sectionMatchers.some(m =>
          m.test ? m.test(token.name) : token.name.startsWith(m)
        )
      ) {
        sectionParts.push(token);
        return false;
      }
      return true;
    });

    if (sectionParts.length) {
      sectionParts.sort((a, b) => {
        let aName = formatBaseTokenNames(a.name);
        let bName = formatBaseTokenNames(b.name);
        let [aToken, aSuffix] = tokenParts(aName);
        let [bToken, bSuffix] = tokenParts(bName);
        if (aSuffix || bSuffix) {
          if (aToken == bToken) {
            let aSize = TSHIRT_ORDER.indexOf(aSuffix);
            let bSize = TSHIRT_ORDER.indexOf(bSuffix);
            if (aSize != -1 && bSize != -1) {
              return aSize - bSize;
            }
            let aState = STATE_ORDER.indexOf(aSuffix);
            let bState = STATE_ORDER.indexOf(bSuffix);
            if (aState != -1 && bState != -1) {
              return aState - bState;
            }
          }
        }
        return aToken.localeCompare(bToken, undefined, { numeric: true });
      });

      let headingParts = [];
      if (!isFirst) {
        headingParts.push("");
      }
      isFirst = false;

      let sectionLevel = "**";
      let labelParts = label.split("/");
      for (let i = 0; i < labelParts.length; i++) {
        if (labelParts[i] != lastSection[i]) {
          headingParts.push(
            `${formatting.indentation}/${sectionLevel} ${labelParts[i]} ${sectionLevel}/`
          );
        }
        sectionLevel += "*";
      }
      lastSection = labelParts;

      outputParts = outputParts.concat(
        headingParts.concat(sectionParts.map(propertyFormatter))
      );
    }
  }

  return outputParts.join("\n");
}


function getTokenCategory(filePath) {
  const fileName = filePath.split("/").at(-1);
  const tokenCategory = fileName.replace(".tokens.json", "");
  return tokenCategory;
}

module.exports = {
  source: ["src/tokens/**/*.json"],
  parsers: [
    {
      pattern: /\.json$/,
      parse: ({ filePath, contents }) =>
        JSON.parse(`{"${getTokenCategory(filePath)}": ${contents}}`),
    },
  ],
  format: {
    "css/variables/modular-css": createModularCssFormat(),
  },
  platforms: {
    css: {
      options: {
        outputReferences: true,
        showFileHeader: false,
      },
      transforms: [
        ...StyleDictionary.transformGroup.css,
        ...["shared", "platform", "brand"].map(createLightDarkTransform),
      ],
      files: [
        // Base tokens - 1:1 mapping with JSON files
        {
          destination: "dist/tokens/base/background.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('background')
        },
        {
          destination: "dist/tokens/base/border.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('border') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/box.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('box') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/color.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('color') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/dimension.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('dimension') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/focus.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('focus') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/font.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('font') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/outline.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('outline') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/size.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('size') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/space.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('space') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/base/text.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('text') && shouldIncludeToken(token)
        },
        // Component tokens - 1:1 mapping with JSON files
        {
          destination: "dist/tokens/components/attention.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('attention') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/badge.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('badge') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/button.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('button') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/checkbox.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('checkbox') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/heading.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('heading') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/icon.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('icon') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/input.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('input') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/link.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('link') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/page.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('page') && shouldIncludeToken(token)
        },
        {
          destination: "dist/tokens/components/table.css",
          format: "css/variables/modular-css",
          filter: token => token.name.startsWith('table') && shouldIncludeToken(token)
        },
      ],
    },
  },
};
