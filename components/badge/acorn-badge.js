/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AcornElement } from '../core/acorn-element.js';

/**
 * A simple badge element that can be used to indicate status or convey simple messages.
 *
 * @tagname acorn-badge
 * @property {string} label - Text to display on the badge
 * @property {string} iconSrc - The src for an optional icon shown next to the label
 * @property {string} title - The title of the badge, appears as a tooltip on hover
 * @property {string} type - The type of badge: "default", "beta", "new"
 */
export class AcornBadge extends AcornElement {
  static properties = {
    label: { type: String },
    iconSrc: { type: String },
    title: { type: String },
    type: { type: String, reflect: true },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .badge {
      display: flex;
      align-items: center;
      gap: var(--space-xsmall);
      padding: var(--space-xsmall) var(--space-small);
      width: fit-content;
      color: var(--badge-text-color);
      border: 1px solid var(--badge-border-color);
      border-radius: var(--border-radius-small);
    }

    .badge-icon {
      width: var(--icon-size-xsmall);
      height: var(--icon-size-xsmall);
      fill: var(--icon-color);
      stroke: var(--icon-color);
    }

    .badge-label {
      font-size: var(--font-size-small);
    }

    :host([type='new']) .badge {
      color: var(--badge-text-color-filled);
      background-color: var(--badge-background-color-filled);
      border-color: var(--badge-border-color-filled);
    }

    :host([type='beta']) .badge {
      color: var(--badge-text-color-filled);
      background-color: var(--badge-background-color-filled);
      border-color: var(--badge-border-color-filled);
    }
  `;

  constructor() {
    super();
    this.label = '';
    this.type = 'default';
  }

  /**
   * Get default label text based on type if no label is provided
   */
  get defaultLabel() {
    if (!this.label) {
      if (this.type === 'beta') return 'Beta';
      if (this.type === 'new') return 'New';
    }
    return this.label;
  }

  render() {
    return html`
      <div class="badge" title=${ifDefined(this.title)}>
        ${this.iconSrc
          ? html`<img
              class="badge-icon"
              src=${this.iconSrc}
              alt=""
              role="presentation"
            />`
          : ''}
        <span class="badge-label">${this.defaultLabel}</span>
      </div>
    `;
  }
}

customElements.define('acorn-badge', AcornBadge);
