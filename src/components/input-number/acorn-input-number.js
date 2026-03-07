/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AcornBaseInputElement } from '../input/acorn-base-input.js';
import { textInputStyles } from '../input/input-styles.js';

/**
 * A number input element.
 *
 * @tagname acorn-input-number
 */
export class AcornInputNumber extends AcornBaseInputElement {
  static properties = {
    placeholder: { type: String },
    readonly: { type: Boolean, reflect: true },
  };

  static inputLayout = 'block';

  static styles = [AcornBaseInputElement.styles, textInputStyles];

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
      type="number"
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

customElements.define('acorn-input-number', AcornInputNumber);
