/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AcornBaseInputElement } from '../input/acorn-base-input.js';

/**
 * A text input element.
 *
 * @tagname acorn-input-text
 * @property {string} label - The text of the label element
 * @property {string} name - The name of the input control
 * @property {string} value - The value of the input control
 * @property {boolean} disabled - The disabled state
 * @property {boolean} readonly - The readonly state
 * @property {string} iconSrc - Optional icon
 * @property {string} description - Help text for the input
 * @property {string} placeholder - Placeholder text
 * @property {string} ariaLabel - Aria-label when no visible label
 * @property {string} ariaDescription - Aria-description when no visible description
 */
export class AcornInputText extends AcornBaseInputElement {
  static properties = {
    placeholder: { type: String },
    readonly: { type: Boolean, reflect: true },
  };

  static inputLayout = 'block';

  static styles = [
    AcornBaseInputElement.styles,
    css`
      input[type='text'] {
        width: 100%;
        padding: var(--space-small);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-small);
        font-family: inherit;
        font-size: var(--font-size-root);
        color: var(--text-color);
        background-color: var(--background-color-box);
      }

      input[type='text']:focus {
        outline: var(--focus-outline);
        outline-offset: var(--focus-outline-offset);
        border-color: var(--border-color-selected);
      }

      input[type='text']:disabled {
        opacity: var(--button-opacity-disabled, 0.5);
        cursor: not-allowed;
      }

      input[type='text']:read-only {
        background-color: var(--background-color-box-info);
        cursor: default;
      }

      input[type='text']::placeholder {
        color: var(--text-color-deemphasized);
      }
    `,
  ];

  constructor() {
    super();
    this.value = '';
    this.readonly = false;
  }

  handleInput(e) {
    this.value = e.target.value;
  }

  inputTemplate() {
    return html`<input
      id="input"
      type="text"
      name=${this.name}
      .value=${this.value}
      ?disabled=${this.disabled || this.parentDisabled}
      ?readonly=${this.readonly}
      accesskey=${ifDefined(this.accessKey)}
      placeholder=${ifDefined(this.placeholder)}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-describedby="description"
      aria-description=${ifDefined(
        this.hasDescription ? undefined : this.ariaDescription
      )}
      @input=${this.handleInput}
      @change=${this.redispatchEvent}
    />`;
  }
}

customElements.define('acorn-input-text', AcornInputText);
