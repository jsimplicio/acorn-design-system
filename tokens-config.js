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
  Heading: "heading",
  Icon: "icon",
  "Input - Text": "input-text",
  "Input - Space": "input-space",
  Link: "link",
  "Outline Color": "outline-color",
  Page: "page",
  Page: "promo",
  Size: "size",
  Space: "space",
  Table: ["table", "table-row"],
  Text: "text",
  Unspecified: "",
};

const TSHIRT_ORDER = ["circle", "xxxsmall", "xxsmall", "xsmall", "small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"];
const STATE_ORDER = ["base", "default", "root", "hover", "active", "focus", "disabled"];
const MEDIA_QUERY_PROPERTY_MAP = { "forced-colors": "forcedColors", "prefers-contrast": "prefersContrast" };

function formatBaseTokenNames(str) {
  return str.replaceAll(/(?<tokenName>\w+)-base(?=\b)/g, "$<tokenName>")
            .replaceAll(/(?<tokenName>\w+)-default(?=\b)/g, "$<tokenName>");
}

/**
 * RELAXED FILTER: 
 * If it's in the dictionary, we print it. No more checking for internal object structures.
 */
function shouldIncludeToken(token) {
  return true; 
}

function isInputRelated(tokenName) {
  return tokenName.includes('button-') || tokenName.startsWith('button-') ||
         tokenName.includes('checkbox-') || tokenName.startsWith('checkbox-') ||
         tokenName.includes('input-') || tokenName.startsWith('input-');
}

const createModularCssFormat = () => args => {
  const licenseString = "/* This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at http://mozilla.org/MPL/2.0/. */\n\n";
  
  return formatBaseTokenNames(
    licenseString +
    formatSimpleTokens({ args }) +
    formatSimpleTokens({ mediaQuery: "prefers-contrast", args }) +
    formatSimpleTokens({ mediaQuery: "forced-colors", args })
  );
};

function formatSimpleTokens({ mediaQuery, args }) {
  let prop = MEDIA_QUERY_PROPERTY_MAP[mediaQuery] ?? "default";
  let tokensToPrint = [];

  args.dictionary.allTokens.forEach(token => {
    let originalVal = getOriginalTokenValue(token, prop, "");
    if (originalVal === undefined && typeof token.original.value === 'object') {
      originalVal = getOriginalTokenValue(token, prop, "brand");
    }
    
    // If we still have nothing, fall back to the raw value (crucial for flat tokens)
    if (originalVal === undefined && typeof token.original.value !== 'object') {
      originalVal = token.original.value;
    }

    if (originalVal !== undefined) {
      tokensToPrint.push(transformToken(token, originalVal, args.dictionary));
    }
  });

  if (!tokensToPrint.length) return "";

  const formattedVars = formatVariables({
    format: "css",
    dictionary: { ...args.dictionary, allTokens: tokensToPrint, allProperties: tokensToPrint },
    outputReferences: false, 
    formatting: { indentation: "  " },
  });

  return mediaQuery 
    ? `\n@media (${mediaQuery}) {\n  :root {\n${formattedVars}\n  }\n}\n`
    : `:root {\n${formattedVars}\n}\n`;
}

function getOriginalTokenValue(token, prop, surface) {
  if (surface) return token.original.value[surface]?.[prop];
  if (prop === "default" && typeof token.original.value !== "object") return token.original.value;
  return token.original.value?.[prop];
}

const createLightDarkTransform = surface => {
  let name = `lightDarkTransform/${surface}`;
  StyleDictionary.registerTransform({
    type: "value",
    transitive: true,
    name,
    matcher: token => surface === "shared" ? (token.original.value?.light && token.original.value?.dark) : (token.original.value?.[surface]?.light && token.original.value?.[surface]?.dark),
    transformer: token => {
      const val = surface === "shared" ? token.original.value : token.original.value[surface];
      return `light-dark(${val.light}, ${val.dark})`;
    },
  });
  return name;
};

function transformToken(token, originalVal, dictionary) {
  let value = originalVal;
  
  if (dictionary.usesReference(value)) {
    const refs = dictionary.getReferences(value);
    refs.forEach(ref => {
      const refRegex = new RegExp(`\\{?${ref.path.join('.')}\\}?`, 'g');
      value = value.replace(refRegex, `var(--${ref.name})`);
    });
  }
  
  return { 
    ...token, 
    value, 
    attributes: token.attributes || {},
    original: { ...token.original, value } 
  };
}

function formatVariables({ format, dictionary, outputReferences, formatting }) {
  let lastSection = [];
  let propertyFormatter = createPropertyFormatter({ outputReferences, dictionary, format, formatting });
  let outputParts = [];
  let remainingTokens = [...dictionary.allTokens];
  let isFirst = true;

  for (let [label, selector] of Object.entries(TOKEN_SECTIONS)) {
    let sectionMatchers = Array.isArray(selector) ? selector : [selector];
    let sectionParts = [];

    remainingTokens = remainingTokens.filter(token => {
      if (sectionMatchers.some(m => m.test ? m.test(token.name) : token.name.startsWith(m))) {
        sectionParts.push(token);
        return false;
      }
      return true;
    });

    if (sectionParts.length) {
      // Basic alphabetical sort to keep it stable
      sectionParts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      let headingParts = [];
      if (!isFirst) headingParts.push("");
      isFirst = false;

      let sectionLevel = "**", labelParts = label.split("/");
      for (let i = 0; i < labelParts.length; i++) {
        if (labelParts[i] !== lastSection[i]) headingParts.push(`${formatting.indentation}/* ${sectionLevel} ${labelParts[i]} ${sectionLevel} */`);
        sectionLevel += "*";
      }
      lastSection = labelParts;
      outputParts = outputParts.concat(headingParts.concat(sectionParts.map(propertyFormatter)));
    }
  }
  return outputParts.join("\n");
}

module.exports = {
  source: ["design-tokens.json"],
  format: { "css/variables/modular-css": createModularCssFormat() },
  platforms: {
    css: {
      options: { outputReferences: false, showFileHeader: false },
      transforms: [...StyleDictionary.transformGroup.css, ...["shared", "platform", "brand"].map(createLightDarkTransform)],
      files: [
        {
          destination: "acorn-tokens/acorn-colors.css",
          format: "css/variables/modular-css",
          filter: token => {
            if (token.name.includes('shadow')) return false;
            if (token.name.startsWith('button-') || token.name.startsWith('badge-') || token.name.startsWith('table-') || token.name.startsWith('promo-')) return false;
            return token.name.includes('color') || token.name.includes('brand') || token.name.startsWith('link-');
          }
        },
        {
          destination: "acorn-tokens/acorn-shadows.css",
          format: "css/variables/modular-css",
          filter: token => token.name.includes('shadow')
        },
        {
          destination: "acorn-tokens/acorn-typography.css",
          format: "css/variables/modular-css",
          filter: token => (token.name.includes('font') || token.name.includes('heading') || token.name.startsWith('text-')) && !token.name.includes('color')
        },
        {
          destination: "acorn-tokens/acorn-dimension.css",
          format: "css/variables/modular-css",
          filter: token => (token.name.includes('size') || token.name.includes('space') || token.name.includes('dimension') || token.name.includes('padding') || token.name.includes('margin')) && !isInputRelated(token.name) && !token.name.includes('font')
        },
        {
          destination: "acorn-tokens/acorn-borders.css",
          format: "css/variables/modular-css",
          filter: token => token.name.includes('border') && !token.name.includes('color') && !isInputRelated(token.name)
        },
        {
          destination: "acorn-tokens/acorn-button.css",
          format: "css/variables/modular-css",
          filter: t => t.name.startsWith('button-')
        },
        {
          destination: "acorn-tokens/acorn-inputs.css",
          format: "css/variables/modular-css",
          filter: t => (t.name.startsWith('input-') || t.name.startsWith('checkbox-') || t.name.startsWith('focus-outline'))
        },
        {
          destination: "acorn-tokens/acorn-badge.css",
          format: "css/variables/modular-css",
          filter: t => t.name.startsWith('badge-')
        },
        {
          destination: "acorn-tokens/acorn-table.css",
          format: "css/variables/modular-css",
          filter: t => t.name.startsWith('table-')
        },
        {
          destination: "acorn-tokens/acorn-promo.css",
          format: "css/variables/modular-css",
          filter: t => t.name.startsWith('promo-')
        }
      ]
    }
  }
};
