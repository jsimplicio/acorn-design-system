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
  Promo: "promo",
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

function shouldIncludeToken(token) {
  if (typeof token.original.value !== 'object') return true;
  const hasSharedOrBrand = token.original.value.brand || token.original.value.light || token.original.value.dark || token.original.value.default;
  return hasSharedOrBrand || !(token.original.value.platform && Object.keys(token.original.value).length === 1);
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
    
    if (originalVal !== undefined) {
      tokensToPrint.push(transformToken(token, originalVal, args.dictionary));
    }
  });

  if (!tokensToPrint.length) return "";

  const formattedVars = formatVariables({
    format: "css",
    dictionary: { ...args.dictionary, allTokens: tokensToPrint, allProperties: tokensToPrint },
    outputReferences: false, // We handle references manually to allow cross-file linking
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
    matcher: token => surface === "shared" ? (token.original.value.light && token.original.value.dark) : (token.original.value[surface]?.light && token.original.value[surface]?.dark),
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
    original: { ...token.original, value } 
  };
}

function formatVariables({ format, dictionary, outputReferences, formatting }) {
  let lastSection = [];
  let propertyFormatter = createPropertyFormatter({ outputReferences, dictionary, format, formatting });
  let outputParts = [];
  let remainingTokens = [...dictionary.allTokens];
  let isFirst = true;

  function tokenParts(name) {
    let lastDash = name.lastIndexOf("-");
    let suffix = name.substring(lastDash + 1);
    return (TSHIRT_ORDER.includes(suffix) || STATE_ORDER.includes(suffix)) ? [name.substring(0, lastDash), suffix] : [name, ""];
  }

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
      sectionParts.sort((a, b) => {
        let aName = formatBaseTokenNames(a.name);
        let bName = formatBaseTokenNames(b.name);
        let [aToken, aSuffix] = tokenParts(aName);
        let [bToken, bSuffix] = tokenParts(bName);
        if (aSuffix || bSuffix) {
          if (aToken === bToken) {
            let aSize = TSHIRT_ORDER.indexOf(aSuffix), bSize = TSHIRT_ORDER.indexOf(bSuffix);
            if (aSize !== -1 && bSize !== -1) return aSize - bSize;
            let aState = STATE_ORDER.indexOf(aSuffix), bState = STATE_ORDER.indexOf(bSuffix);
            if (aState !== -1 && bState !== -1) return aState - bState;
          }
        }
        return aToken.localeCompare(bToken, undefined, { numeric: true });
      });

      let headingParts = [];
      if (!isFirst) headingParts.push("");
      isFirst = false;

      let sectionLevel = "**", labelParts = label.split("/");
      for (let i = 0; i < labelParts.length; i++) {
        if (labelParts[i] !== lastSection[i]) headingParts.push(`${formatting.indentation}/${sectionLevel} ${labelParts[i]} ${sectionLevel}/`);
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
      options: { 
        outputReferences: false, // Must be false so we can handle cross-file logic manually
        showFileHeader: false 
      },
      transforms: [...StyleDictionary.transformGroup.css, ...["shared", "platform", "brand"].map(createLightDarkTransform)],
      files: [
        {
          destination: "acorn-tokens/acorn-colors.css",
          format: "css/variables/modular-css",
          filter: token => {
            if (token.name.includes('shadow') && token.name.includes('color')) return false;
            if (token.name.startsWith('button-') || token.name.startsWith('badge-') || token.name.startsWith('table-') || token.name.startsWith('promo-')) return false;
            const isColorToken = token.name.startsWith('color-') || token.name.includes('-color') || token.name.startsWith('background-color') || token.name.startsWith('border-color') || token.name.startsWith('text-color') || token.name.startsWith('icon-color') || token.name.startsWith('link-color') || token.name.startsWith('link-') || token.name.startsWith('outline-color') || token.name === 'attention-dot-color' || token.name === 'focus-outline-color' || (token.name.includes('checkbox-') && token.name.includes('color')) || (token.name.includes('input-') && token.name.includes('color')) || (token.name.startsWith('icon-') && token.name.includes('color'));
            return isColorToken && shouldIncludeToken(token);
          }
        },
        {
          destination: "acorn-tokens/acorn-typography.css",
          format: "css/variables/modular-css",
          filter: token => {
            if (isInputRelated(token.name)) return false;
            const isTypographyToken = token.name.startsWith('font-') || token.name.includes('font-') || token.name.startsWith('heading-') || (token.name.startsWith('text-') && !token.name.includes('color'));
            return isTypographyToken && shouldIncludeToken(token);
          }
        },
        {
          destination: "acorn-tokens/acorn-dimension.css",
          format: "css/variables/modular-css",
          filter: token => {
            if (isInputRelated(token.name) || token.name.startsWith('button-') || token.name.includes('font-size') || token.name.includes('border-width') || token.name.includes('focus-outline') || token.name.startsWith('checkbox-') || token.name.startsWith('input-')) return false;
            const isDim = token.name.startsWith('dimension-') || token.name.startsWith('space-') || token.name.startsWith('padding-') || token.name.startsWith('margin-') || token.name.includes('-size') || token.name.startsWith('width-') || token.name.startsWith('height-') || token.name.startsWith('icon-size') || token.name.startsWith('page-') || token.name.startsWith('size-');
            return isDim && shouldIncludeToken(token);
          }
        },
        {
          destination: "acorn-tokens/acorn-borders.css",
          format: "css/variables/modular-css",
          filter: token => !isInputRelated(token.name) && (token.name.startsWith('border-') || token.name.includes('-border')) && !token.name.includes('-color') && shouldIncludeToken(token)
        },
        {
          destination: "acorn-tokens/acorn-shadows.css",
          format: "css/variables/modular-css",
          filter: token => (token.name.includes('shadow') || token.name.includes('box-shadow')) && shouldIncludeToken(token)
        },
        {
          destination: "acorn-tokens/acorn-inputs.css",
          format: "css/variables/modular-css",
          filter: token => {
            if (token.name.startsWith('button-')) return false;
            const isInput = isInputRelated(token.name) || (token.name.startsWith('focus-outline') && !token.name.includes('-color'));
            return isInput && !token.name.includes('-color') && shouldIncludeToken(token);
          }
        },
        { destination: "acorn-tokens/acorn-button.css", format: "css/variables/modular-css", filter: t => t.name.startsWith('button-') && shouldIncludeToken(t) },
        { destination: "acorn-tokens/acorn-badge.css", format: "css/variables/modular-css", filter: t => t.name.startsWith('badge-') && shouldIncludeToken(t) },
        { destination: "acorn-tokens/acorn-table.css", format: "css/variables/modular-css", filter: t => (t.name.startsWith('table-') || t.name.startsWith('table-row-')) && shouldIncludeToken(t) },
        { destination: "acorn-tokens/acorn-promo.css", format: "css/variables/modular-css", filter: t => t.name.startsWith('promo-') && shouldIncludeToken(t) }
      ]
    }
  }
};
