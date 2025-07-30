/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");
const { createPropertyFormatter } = StyleDictionary.formatHelpers;

const TOKEN_SECTIONS = {
  "Attention Dot": "attention-dot",
  "Background Color": "background-color",
  Border: "border",
  "Box Shadow": "box-shadow",
  Button: "button",
  Checkbox: "checkbox",
  Color: ["brand-color", "color", "platform-color"],
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
  Size: "size",
  Space: "space",
  "Table Row": "table-row",
  Text: "text",
  Unspecified: "",
};
const TSHIRT_ORDER = [
  "circle",
  "xxxsmall",
  "xxsmall",
  "xsmall",
  "small",
  "medium",
  "large",
  "xlarge",
  "xxlarge",
  "xxxlarge",
];
const STATE_ORDER = [
  "base",
  "default",
  "root",
  "hover",
  "active",
  "focus",
  "disabled",
];


const MEDIA_QUERY_PROPERTY_MAP = {
  "forced-colors": "forcedColors",
  "prefers-contrast": "prefersContrast",
};

function formatBaseTokenNames(str) {
  return str.replaceAll(/(?<tokenName>\w+)-base(?=\b)/g, "$<tokenName>");
}


/**
 * Creates a simple formatter for acorn-colors.css without layers or anonymous-content-host
 * @returns {Function} - Formatter function that returns a simple CSS string.
 */
const createSimpleColorsFormat = () => args => {
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
  let surfaceComment = token.original?.value[surface]?.comment;
  let finalComment = surfaceComment ?? token.comment;
  
  // Filter out TODO comments to keep the generated CSS clean
  if (finalComment && finalComment.startsWith('TODO')) {
    finalComment = undefined;
  }
  
  return { ...token, value, comment: finalComment };
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


module.exports = {
  source: ["design-tokens.json"],
  format: {
    "css/variables/simple-colors": createSimpleColorsFormat(),
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
	{
	  destination: "acorn-tokens/acorn-colors.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Exclude shadow-related color tokens (they go to shadows)
	    if (token.name.includes('shadow') && token.name.includes('color')) return false;
	    
	    // First exclude button color tokens (they go to acorn-inputs.css)
	    if (token.name.includes('button-') && token.name.includes('color')) return false;
	    
	    // Match ALL other color-related tokens including:
	    // - Color palettes (color-red-10, color-blue-50, etc.)
	    // - Background colors (background-color-*)
	    // - Border colors (border-color-*)
	    // - Text colors (text-color-*)
	    // - Icon colors (icon-color-*)
	    // - Link colors (link-color-*)
	    // - Table colors (table-*-color)
	    // - Outline colors (outline-color-*)
	    // - Attention dot color
	    // - Focus outline color
	    const isColorToken = token.name.startsWith('color-') ||
	                        token.name.includes('-color') ||
	                        token.name.startsWith('background-color') ||
	                        token.name.startsWith('border-color') ||
	                        token.name.startsWith('text-color') ||
	                        token.name.startsWith('icon-color') ||
	                        token.name.startsWith('link-color') ||
	                        token.name.startsWith('link-') ||
	                        token.name.startsWith('table-') ||
	                        token.name.startsWith('outline-color') ||
	                        token.name === 'attention-dot-color' ||
	                        token.name === 'focus-outline-color' ||
	                        // Include checkbox color tokens
	                        (token.name.includes('checkbox-') && token.name.includes('color')) ||
	                        // Include input color tokens
	                        (token.name.includes('input-') && token.name.includes('color')) ||
	                        // Include icon color tokens
	                        (token.name.startsWith('icon-') && token.name.includes('color'));
	    
	    if (!isColorToken) return false;
	    
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
	},
	{
	  destination: "acorn-tokens/acorn-typography.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Exclude input-related tokens (buttons, checkboxes, input-text, etc.)
	    if (token.name.includes('button-') || token.name.startsWith('button-') ||
	        token.name.includes('checkbox-') || token.name.startsWith('checkbox-') ||
	        token.name.includes('input-') || token.name.startsWith('input-')) return false;
	    
	    // Match all typography-related tokens:
	    // - Font tokens (font-size, font-weight, etc.)
	    // - Heading tokens (heading-font-size-*, heading-font-weight)
	    // - Text tokens (text-color is excluded as it goes to colors)
	    const isTypographyToken = token.name.startsWith('font-') ||
	                             token.name.includes('font-') ||
	                             token.name.startsWith('heading-') ||
	                             (token.name.startsWith('text-') && !token.name.includes('color'));
	    
	    if (!isTypographyToken) return false;
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	},
	{
	  destination: "acorn-tokens/acorn-space.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Exclude input-related tokens (buttons, checkboxes, input-text, etc.)
	    if (token.name.includes('button-') || token.name.startsWith('button-') ||
	        token.name.includes('checkbox-') || token.name.startsWith('checkbox-') ||
	        token.name.includes('input-') || token.name.startsWith('input-')) return false;
	    
	    // Match all space-related tokens:
	    // - Space tokens (space-*, --space-*)
	    // - Padding tokens (padding-*, --*-padding)
	    // - Margin tokens (margin-*, --*-margin)
	    const isSpaceToken = token.name.startsWith('space-') ||
	                       token.name.includes('-space') ||
	                       token.name.startsWith('padding-') ||
	                       token.name.includes('-padding') ||
	                       token.name.startsWith('margin-') ||
	                       token.name.includes('-margin');
	    
	    if (!isSpaceToken) return false;
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	},
	{
	  destination: "acorn-tokens/acorn-size.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Exclude all button tokens from the size file
	    if (token.name.startsWith('button-')) {
	      return false;
	    }

	    // Exclude font-size tokens from the size file (they belong in typography)
	    if (token.name.includes('font-size')) {
	      return false;
	    }
	    // Match all size-related tokens:
	    // - Size tokens (size-*, --size-*)
	    // - Width tokens (width-*, --*-width)
	    // - Height tokens (height-*, --*-height)
	    // - Icon size tokens (icon-size-*)
	    // - Page dimensions (page-*-width, page-*-height)
	    // - Button size tokens (button-size-*) but not color or other non-size properties
	    const isSizeToken = token.name.startsWith('size-') ||
	                       token.name.includes('-size') ||
	                       token.name.startsWith('width-') ||
	                       token.name.includes('-width') ||
	                       token.name.startsWith('height-') ||
	                       token.name.includes('-height') ||
	                       token.name.startsWith('icon-size') ||
	                       token.name.startsWith('page-') ||
	                       token.name.includes('page-') ||
	                       // Include button size tokens but exclude other button properties
	                       (token.name.includes('button-size') && !token.name.includes('color'));
	    
	    if (!isSizeToken) return false;

	    // Exclude border-width from the size file (goes to borders)
	    if (token.name.includes('border-width')) return false;
	    
	    // Exclude other input-related non-size tokens
	    if ((token.name.includes('button') || token.name.includes('checkbox') || token.name.includes('input')) && 
	        !token.name.includes('-size') && !token.name.includes('-width') && !token.name.includes('-height') && !token.name.includes('font-size')) {
	      return false;
	    }

	    // Exclude checkbox and input tokens from acorn-size.css
	    if (token.name.startsWith('checkbox-') || token.name.startsWith('input-')) {
	      return false;
	    }
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	},
	{
	  destination: "acorn-tokens/acorn-borders.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Exclude input-related tokens (buttons, checkboxes, input-text, etc.)
	    if (token.name.includes('button') || token.name.includes('checkbox') || token.name.includes('input')) return false;

	    // Match all border-related tokens except colors
	    const isBorderToken = (token.name.startsWith('border-') || token.name.includes('-border')) && !token.name.includes('-color');
	    
	    if (!isBorderToken) return false;
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	},
	{
	  destination: "acorn-tokens/acorn-shadows.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Match shadow-related token names (including box-shadow)
	    const isShadowToken = token.name.includes('shadow') ||
	                         token.name.includes('box-shadow') ||
	                         token.name.startsWith('box-shadow-');
	    
	    if (!isShadowToken) return false;
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	},
	{
	  destination: "acorn-tokens/acorn-inputs.css",
	  format: "css/variables/simple-colors",
	  filter: token => {
	    // Match input-related token names (buttons, checkboxes, input-text, etc.) and focus outline tokens (except color)
	    // NOTE: Button color tokens are now included here instead of acorn-colors.css
	    const isInputToken = token.name.includes('button-') || 
	                        token.name.startsWith('button-') ||
	                        token.name.includes('checkbox-') ||
	                        token.name.startsWith('checkbox-') ||
	                        token.name.includes('input-') ||
	                        token.name.startsWith('input-') ||
	                        (token.name.startsWith('focus-outline') && !token.name.includes('-color'));
	    
	    if (!isInputToken) return false;
	    
	    // Exclude color tokens as they go to colors file, EXCEPT button colors which belong here
	    if (token.name.includes('-color') && !token.name.includes('button-')) return false;
	    
	    // For simple values (not objects), include them
	    if (typeof token.original.value !== 'object') {
	      return true;
	    }
	    
	    // Include tokens that have brand, shared, or non-platform-only definitions
	    const hasSharedOrBrand = token.original.value.brand ||
	                            token.original.value.light ||
	                            token.original.value.dark ||
	                            token.original.value.default;
	    
	    const isPlatformOnly = token.original.value.platform &&
	                          Object.keys(token.original.value).length === 1;
	    
	    return hasSharedOrBrand || !isPlatformOnly;
	  }
	}
      ],
    },
  },
};
