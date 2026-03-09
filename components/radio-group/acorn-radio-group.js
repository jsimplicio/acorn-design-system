import { html, css, LitElement } from 'lit';
import { AcornBaseInputElement } from '../input/acorn-base-input.js';

/**
 * Radio group component that manages a collection of radio buttons
 * 
 * @tagname acorn-radio-group
 * @property {string} label - Label for the radio group
 * @property {string} name - Name for the radio inputs
 * @property {string} value - Currently selected value
 * @property {boolean} disabled - Whether the entire group is disabled
 */
class AcornRadioGroup extends AcornBaseInputElement {
  static properties = {};
  
  static inputLayout = 'block';

  static styles = [
    AcornBaseInputElement.styles,
    css`
      ::slotted(acorn-radio) {
        display: block;
        margin-bottom: var(--space-xsmall);
      }
    `,
  ];

  constructor() {
    super();
    this.value = '';
  }

  firstUpdated() {
    this._updateRadios();
  }

  updated(changedProperties) {
    if (changedProperties.has('value') || changedProperties.has('name') || changedProperties.has('disabled')) {
      this._updateRadios();
    }
  }

  _updateRadios() {
    const radios = this._getRadios();
    radios.forEach(radio => {
      if (this.name) {
        radio.name = this.name;
      }
      radio.checked = radio.value === this.value;
      radio.groupDisabled = this.disabled;
    });
  }

  _getRadios() {
    const slot = this.shadowRoot.querySelector('slot');
    return slot ? slot.assignedElements().filter(el => el.tagName === 'ACORN-RADIO') : [];
  }

  _handleChange(e) {
    if (e.target.tagName === 'ACORN-RADIO') {
      this.value = e.target.value;
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      }));
    }
  }

  inputTemplate() {
    return html`
      <slot @change=${this._handleChange}></slot>
    `;
  }
}

/**
 * Radio button component
 * 
 * @tagname acorn-radio
 * @property {string} label - Label text for the radio
 * @property {string} value - Value of the radio
 * @property {string} name - Name attribute (set by radio group)
 * @property {boolean} checked - Whether radio is checked
 * @property {boolean} disabled - Whether radio is disabled
 * @property {boolean} groupDisabled - Whether parent group is disabled (internal)
 */
class AcornRadio extends AcornBaseInputElement {
  static properties = {
    checked: { type: Boolean, reflect: true },
    groupDisabled: { type: Boolean, attribute: false },
  };

  static inputLayout = 'inline';

  static styles = [
    AcornBaseInputElement.styles,
    css`
    :host([groupDisabled]) {
      opacity: var(--button-opacity-disabled);
      cursor: not-allowed;
    }

    #input {
      appearance: none;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-circle);
      cursor: pointer;
      position: relative;
    }

    #input:checked {
      border-color: var(--color-accent-primary);
      background-color: transparent;
    }

    #input:checked::after {
      background-color: var(--color-accent-primary);
      border-radius: inherit;
      content: '';
      display: block;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      height: 10px;
      position: absolute;
      width: 10px;
    }

    #input:focus-visible {
      outline: var(--focus-outline);
      outline-offset: var(--focus-outline-offset);
    }

    #input:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    :host([groupDisabled]) label {
      cursor: not-allowed;
    }
  `,
  ];

  constructor() {
    super();
    this.checked = false;
    this.groupDisabled = false;
  }

  get isDisabled() {
    return this.disabled || this.groupDisabled;
  }

  _handleChange(e) {
    if (this.isDisabled) {
      e.preventDefault();
      return;
    }
    
    this.checked = e.target.checked;
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value, checked: this.checked }
    }));
  }

  inputTemplate() {
    return html`
      <input
        id="input"
        type="radio"
        .value=${this.value}
        .name=${this.name}
        .checked=${this.checked}
        ?disabled=${this.isDisabled}
        @change=${this._handleChange}
      />
    `;
  }
}

customElements.define('acorn-radio-group', AcornRadioGroup);
customElements.define('acorn-radio', AcornRadio);
