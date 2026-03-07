/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { AcornElement } from '../core/acorn-element.js';

/**
 * Base class for form-associated input elements.
 * Provides common properties, form integration, and layout patterns.
 * 
 * Subclasses must implement inputTemplate() which returns the actual input element.
 * 
 * @property {string} label - The text of the label element
 * @property {string} name - The name of the input control
 * @property {string} value - The value of the input control
 * @property {boolean} disabled - The disabled state
 * @property {string} iconSrc - Optional icon displayed with the label
 * @property {string} description - Help text for the input
 * @property {string} ariaLabel - Aria-label when no visible label
 * @property {string} ariaDescription - Aria-description when no visible description
 * @property {string} accessKey - Keyboard shortcut
 * @property {boolean} parentDisabled - For nested inputs, disabled by parent
 * @property {string} inputLayout - Layout mode: "inline", "block", "inline-end"
 */
export class AcornBaseInputElement extends AcornElement {
  static formAssociated = true;
  
  #internals;
  #hasSlottedContent = new Map();

  static properties = {
    label: { type: String },
    name: { type: String },
    value: { type: String },
    iconSrc: { type: String },
    disabled: { type: Boolean },
    description: { type: String },
    accessKey: { type: String },
    parentDisabled: { type: Boolean, state: true },
    ariaLabel: { type: String },
    ariaDescription: { type: String },
    inputLayout: { type: String, reflect: true, attribute: 'inputlayout' },
  };

  /** @type {"inline" | "block" | "inline-end"} */
  static inputLayout = 'inline';
  
  /** @type {keyof AcornBaseInputElement} */
  static activatedProperty = null;

  static styles = css`
    :host {
      display: block;
    }

    .content-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xsmall);
    }

    :host([inputlayout='inline']) .content-wrapper {
      flex-direction: row;
      align-items: center;
    }

    .label-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-xsmall);
      flex: 1;
    }

    label {
      display: flex;
      align-items: center;
      gap: var(--space-small);
      cursor: pointer;
    }

    :host([inputlayout='inline']) label {
      flex-direction: row;
    }

    :host([inputlayout='block']) label {
      flex-direction: column;
      align-items: flex-start;
    }

    .icon {
      width: var(--icon-size);
      height: var(--icon-size);
      flex-shrink: 0;
    }

    .text-container {
      display: flex;
      align-items: center;
      gap: var(--space-small);
    }

    .text {
      color: var(--text-color);
    }

    .description {
      color: var(--text-color-deemphasized);
      font-size: var(--font-size-small);
    }

    .description-text {
      display: block;
    }
  `;

  constructor() {
    super();
    this.disabled = false;
    this.inputLayout = this.constructor.inputLayout;
    this.#internals = this.attachInternals();
  }

  get form() {
    return this.#internals.form;
  }

  /**
   * Sets the form value for this input
   */
  setFormValue(value) {
    this.#internals.setFormValue(value);
  }

  /**
   * Called when form is reset
   */
  formResetCallback() {
    this.value = this.defaultValue;
  }

  connectedCallback() {
    super.connectedCallback();
    const val = this.getAttribute('value') || this.value || '';
    this.defaultValue = val;
    this.value = val;
    this.#internals.setFormValue(this.value || null);
  }

  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);
    
    this.#updateInternalState(this.description, 'description');
    this.#updateInternalState(this.label, 'label');

    if (changedProperties.has('value')) {
      this.setFormValue(this.value);
    }

    const activatedProperty = this.constructor.activatedProperty;
    if (
      (activatedProperty && changedProperties.has(activatedProperty)) ||
      changedProperties.has('disabled') ||
      changedProperties.has('parentDisabled')
    ) {
      this.updateNestedElements();
    }
  }

  #updateInternalState(propVal, stateKey) {
    const internalStateKey = `has-${stateKey}`;
    const hasValue = !!(propVal || this.#hasSlottedContent.get(stateKey));

    if (this.#internals.states?.has(internalStateKey) === hasValue) {
      return;
    }

    if (hasValue) {
      this.#internals.states.add(internalStateKey);
    } else {
      this.#internals.states.delete(internalStateKey);
    }
  }

  updateNestedElements() {
    if (this.isDisabled) {
      this.#internals.states.add('disabled');
    } else {
      this.#internals.states.delete('disabled');
    }
    
    for (const el of this.nestedEls) {
      if ('parentDisabled' in el) {
        el.parentDisabled =
          this.parentDisabled ||
          !this[this.constructor.activatedProperty] ||
          this.disabled;
      }
    }
  }

  get inputEl() {
    return this.renderRoot.getElementById('input');
  }

  get labelEl() {
    return this.renderRoot.querySelector('label');
  }

  get icon() {
    return this.renderRoot.querySelector('.icon');
  }

  get descriptionEl() {
    return this.renderRoot.getElementById('description');
  }

  get nestedEls() {
    return this.renderRoot.querySelector('.nested')?.assignedElements() ?? [];
  }

  get hasDescription() {
    return this.#internals.states.has('has-description');
  }

  get hasLabel() {
    return this.#internals.states.has('has-label');
  }

  get isDisabled() {
    return !!(this.disabled || this.parentDisabled);
  }

  click() {
    this.inputEl?.click();
  }

  focus() {
    this.inputEl?.focus();
  }

  select() {
    this.inputEl?.select();
  }

  blur() {
    this.inputEl?.blur();
  }

  /**
   * Redispatches events from the input to the host element
   */
  redispatchEvent(event) {
    const { bubbles, cancelable, composed, type } = event;
    const newEvent = new Event(type, {
      bubbles,
      cancelable,
      composed,
    });
    this.dispatchEvent(newEvent);
  }

  /**
   * Must be implemented by subclasses - returns the input element template
   */
  inputTemplate() {
    throw new Error(
      'inputTemplate() must be implemented and provide the input element'
    );
  }

  /**
   * Can be overridden by subclasses to add input-specific styles
   */
  inputStylesTemplate() {
    return '';
  }

  render() {
    return html`
      ${this.inputStylesTemplate()}
      <div class="content-wrapper">
        <span class="label-wrapper">
          <label id="label" part="label" for="input">
            ${this.inputLayout === 'inline' ? this.inputTemplate() : ''}
            ${this.labelTemplate()}
          </label>
          ${this.descriptionTemplate()}
        </span>
        ${this.inputLayout !== 'inline' ? this.inputTemplate() : ''}
      </div>
      ${this.nestedFieldsTemplate()}
    `;
  }

  labelTemplate() {
    if (!this.label) {
      return html`<slot name="label" @slotchange=${this.onSlotchange}></slot>`;
    }
    return html`<span class="text-container">
      ${this.iconTemplate()}
      <span class="text">${this.label}</span>
    </span>`;
  }

  descriptionTemplate() {
    if (!this.description && !this.hasDescription) {
      return '';
    }
    return html`
      <div class="description">
        <span id="description" class="description-text">
          ${this.description ||
          html`<slot
            name="description"
            @slotchange=${this.onSlotchange}
          ></slot>`}
        </span>
      </div>
    `;
  }

  iconTemplate() {
    if (this.iconSrc) {
      return html`<img src=${this.iconSrc} alt="" class="icon" />`;
    }
    return '';
  }

  nestedFieldsTemplate() {
    if (this.constructor.activatedProperty) {
      return html`<slot
        name="nested"
        class="nested"
        @slotchange=${this.updateNestedElements}
      ></slot>`;
    }
    return '';
  }

  onSlotchange(e) {
    const propName = e.target.name;
    const hasSlottedContent = e.target
      .assignedNodes()
      .some((node) => node.textContent?.trim());

    if (hasSlottedContent === this.#hasSlottedContent.get(propName)) {
      return;
    }

    this.#hasSlottedContent.set(propName, hasSlottedContent);
    this.requestUpdate();
  }
}
