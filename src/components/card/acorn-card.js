/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { html as staticHtml, literal } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';
import { AcornElement } from '../core/acorn-element.js';

/**
 * Cards contain content and actions about a single subject.
 * There are two card types:
 * - Default: displays content without additional functionality
 * - Accordion: initially hides content with an expand/collapse control
 *
 * @tagname acorn-card
 * @property {string} heading - The heading text for the card
 * @property {number} headingLevel - Heading level (1-6) for semantic HTML. 0 = span
 * @property {string} iconSrc - Path to an icon displayed with the heading
 * @property {string} type - Card type: "default" or "accordion"
 * @property {boolean} expanded - For accordion cards, controls open/closed state
 * @slot default - The card's main content
 */
export class AcornCard extends AcornElement {
  static queries = {
    detailsEl: '#card-details',
    headingEl: '#heading',
    contentEl: '#content',
    summaryEl: 'summary',
    contentSlotEl: '#content-slot',
  };

  static properties = {
    heading: { type: String },
    headingLevel: { type: Number },
    iconSrc: { type: String },
    type: { type: String, reflect: true },
    expanded: { type: Boolean },
  };

  static styles = css`
    :host {
      --card-border-radius: var(--border-radius-large);
      --card-border-width: var(--border-width);
      --card-border: var(--card-border-width) solid var(--border-color-card);
      --card-background-color: var(--background-color-box);
      --card-focus-outline: var(--focus-outline);
      --card-box-shadow: var(--box-shadow-card);
      --card-padding: var(--space-large);
      --card-gap: var(--card-padding);
      --card-article-gap: var(--space-small);

      display: block;
      border: var(--card-border);
      border-radius: var(--card-border-radius);
      background-color: var(--card-background-color);
      box-shadow: var(--card-box-shadow);
      box-sizing: border-box;
    }

    :host([type='accordion']) summary {
      padding-block: var(--card-padding-block, var(--card-padding));
    }

    :host([type='accordion']) #content {
      padding-block-end: var(--card-padding-block, var(--card-padding));
    }

    :host(:not([type='accordion'])) .card {
      padding-block: var(--card-padding-block, var(--card-padding));
    }

    :host(:not([type='accordion'])) #card-details {
      display: flex;
      flex-direction: column;
      gap: var(--card-article-gap);
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--card-article-gap);
    }

    #card-details {
      width: 100%;
    }

    summary {
      cursor: pointer;
      list-style: none;
      border-radius: var(--card-border-radius);
    }

    summary:hover {
      background-color: var(--button-background-color-hover);
    }

    summary:focus-visible {
      outline: var(--card-focus-outline);
    }

    #heading-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--card-gap);
      padding-inline: var(--card-heading-padding-inline, var(--card-padding));
      border-radius: var(--card-border-radius);
    }

    .chevron-icon {
      background-position: center;
      background-repeat: no-repeat;
      width: var(--icon-size);
      height: var(--icon-size);
      min-width: var(--icon-size);
      min-height: var(--icon-size);
      padding: 0;
      flex-shrink: 0;
      fill: currentColor;
    }

    .chevron-icon::after {
      content: '▼';
      display: block;
      text-align: center;
    }

    details[open] .chevron-icon::after {
      content: '▲';
    }

    #heading-icon {
      fill: currentColor;
      width: var(--icon-size);
      height: var(--icon-size);
      min-width: var(--icon-size);
      min-height: var(--icon-size);
      padding: 0;
      flex-shrink: 0;
    }

    #heading {
      margin: 0;
      font-weight: var(--heading-font-weight);
    }

    #heading:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6) {
      font-size: var(--card-heading-font-size, var(--font-size-root));
    }

    #content {
      align-self: stretch;
      padding-inline: var(--card-padding-inline, var(--card-padding));
      border-end-start-radius: var(--card-border-radius);
      border-end-end-radius: var(--card-border-radius);
    }

    details[open] summary {
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }
  `;

  constructor() {
    super();
    this.type = 'default';
    this.expanded = false;
    this.headingLevel = 0;
  }

  headingTextTemplate() {
    const headingLevels = [
      literal`span`,
      literal`h1`,
      literal`h2`,
      literal`h3`,
      literal`h4`,
      literal`h5`,
      literal`h6`,
    ];
    const tagName = headingLevels[this.headingLevel] || headingLevels[0];
    return staticHtml`<${tagName} id="heading" title=${ifDefined(
      this.heading
    )} part="heading">${this.heading}</${tagName}>`;
  }

  headingTemplate() {
    if (!this.heading) {
      return '';
    }
    return html`
      <div id="heading-wrapper" part="card-heading-wrapper">
        ${when(
          this.type === 'accordion',
          () => html`<div class="chevron-icon"></div>`
        )}
        ${when(
          !!this.iconSrc,
          () =>
            html`<img
              id="heading-icon"
              src=${this.iconSrc}
              alt=""
              role="presentation"
            />`
        )}
        ${this.headingTextTemplate()}
      </div>
    `;
  }

  cardTemplate() {
    if (this.type === 'accordion') {
      return html`
        <details
          id="card-details"
          @toggle=${this.onToggle}
          ?open=${this.expanded}
        >
          <summary part="summary">${this.headingTemplate()}</summary>
          <div id="content"><slot id="content-slot"></slot></div>
        </details>
      `;
    }

    return html`
      <div id="card-details">
        ${this.headingTemplate()}
        <div id="content" aria-describedby="content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  onToggle() {
    this.expanded = this.detailsEl.open;
    this.dispatchEvent(
      new CustomEvent('toggle', {
        detail: {
          open: this.detailsEl.open,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <article
        class="card"
        aria-labelledby=${ifDefined(this.heading ? 'heading' : undefined)}
      >
        ${this.cardTemplate()}
      </article>
    `;
  }
}

customElements.define('acorn-card', AcornCard);
