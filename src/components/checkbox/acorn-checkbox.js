/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AcornBaseInputElement } from '../input/acorn-base-input.js';

/**
 * A checkbox input with a label.
 *
 * @tagname acorn-checkbox
 * @property {string} label - The text of the label element
 * @property {string} name - The name of the checkbox input control
 * @property {string} value - The value of the checkbox input control
 * @property {boolean} checked - The checked state of the checkbox
 * @property {boolean} disabled - The disabled state
 * @property {string} iconSrc - Optional icon
 * @property {string} description - Help text for the checkbox
 * @property {string} ariaLabel - Aria-label when no visible label
 * @property {string} ariaDescription - Aria-description when no visible description
 */
export class AcornCheckbox extends AcornBaseInputElement {
  static properties = {
    checked: { type: Boolean, reflect: true },
  };

  static activatedProperty = 'checked';

  static styles = [
    AcornBaseInputElement.styles,
    css`
      input[type='checkbox'] {
        width: var(--checkbox-size, 16px);
        height: var(--checkbox-size, 16px);
        margin: 0;
        cursor: pointer;
        accent-color: var(--color-accent-primary);
      }

      input[type='checkbox']:disabled {
        cursor: not-allowed;
        opacity: var(--button-opacity-disabled, 0.5);
      }

      input[type='checkbox']:focus-visible {
        outline: var(--focus-outline);
        outline-offset: var(--focus-outline-offset);
      }
    `,
  ];

  constructor() {
    super();
    this.checked = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.defaultChecked = this.hasAttribute('checked') || this.checked;
    this.checked = !!this.defaultChecked;
    
    const val = this.getAttribute('value');
    if (!val) {
      this.defaultValue = 'on';
      this.value = 'on';
    } else {
      this.defaultValue = val;
      this.value = val;
    }
    this.setFormValue(this.checked ? this.value : null);
  }

  /**
   * Handles state changes and keeps checkbox value in sync
   */
  handleStateChange(event) {
    this.checked = event.target.checked;
    if (this.checked) {
      this.setFormValue(this.value);
    } else {
      this.setFormValue(null);
    }
  }

  formResetCallback() {
    this.checked = this.defaultChecked;
    this.value = this.defaultValue;
  }

  inputTemplate() {
    return html`<input
      id="input"
      type="checkbox"
      name=${this.name}
      .value=${this.value}
      .checked=${this.checked}
      @click=${this.handleStateChange}
      @change=${this.redispatchEvent}
      ?disabled=${this.disabled || this.parentDisabled}
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-describedby="description"
      aria-description=${ifDefined(
        this.hasDescription ? undefined : this.ariaDescription
      )}
      accesskey=${ifDefined(this.accessKey)}
    />`;
  }
}

customElements.define('acorn-checkbox', AcornCheckbox);
