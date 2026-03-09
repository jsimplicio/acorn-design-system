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
      --input-height: var(--size-item-small);
      --input-width: var(--size-item-small);
      --input-space-offset: calc(var(--input-width) + var(--space-small));
      --input-nested-offset: var(--input-space-offset);
      --input-margin-block-adjust: calc((1lh - var(--input-height)) / 2);
      --icon-margin-block-adjust: calc((1lh - var(--icon-size)) / 2);
      --input-margin-inline-start-adjust: calc(-1 * var(--input-space-offset));
    }

    :host(:not(:state(has-label))) {
      --input-space-offset: var(--input-width);
    }

    :host([inputlayout="block"]) {
      --input-space-offset: 0;
      --input-nested-offset: var(--space-xlarge);
      --input-margin-block-adjust: var(--space-xsmall) 0;
    }

    :host([inputlayout="block"]:not(:state(has-label), :state(has-description))) {
      --input-margin-block-adjust: 0;
    }

    :host([inputlayout="inline-end"]) {
      --input-space-offset: 0;
      --input-nested-offset: var(--space-xlarge);
    }

    :host(:not([hidden])) {
      display: block;
    }

    :host(:not([hidden], :state(has-label), [inputlayout="block"])) {
      display: inline-block;
    }

    @media (forced-colors) {
      :host(:state(disabled)) {
        color: var(--text-color-disabled);
      }
    }

    /* Inline-end layout */
    :host([inputlayout="inline-end"]) .content-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-medium);
    }

    :host([inputlayout="inline-end"]) .label-wrapper {
      flex: 1;
    }

    :host([inputlayout="inline-end"]) .description {
      margin-block-start: var(--space-xxsmall);
    }

    /* Label text */
    .label-wrapper {
      display: block;
      padding-inline-start: var(--input-space-offset);
    }

    label {
      display: block;
    }

    :host(:state(disabled)) label {
      color: var(--text-color-disabled);
    }

    /* Input */
    #input {
      min-width: var(--input-width);
      min-height: var(--input-height);
      font-size: inherit;
      font-family: inherit;
      line-height: inherit;
      vertical-align: top;
      margin-block: var(--input-margin-block-adjust);
      margin-inline: var(--input-margin-inline-start-adjust) var(--space-small);
    }

    :host(:not(:state(has-label))) #input {
      margin-inline-end: 0;
    }

    @media not (forced-colors) {
      #input {
        accent-color: var(--color-accent-primary);
      }
    }

    /* Icon */
    .icon {
      vertical-align: top;
      width: var(--icon-size);
      height: var(--icon-size);
      margin-block: var(--icon-margin-block-adjust);
      -moz-context-properties: fill, fill-opacity, stroke;
      fill: currentColor;
      stroke: currentColor;
    }

    .icon + .text {
      margin-inline-start: var(--space-small);
    }

    /* Description */
    :host(:state(has-description)) .description {
      margin-block-start: var(--space-xxsmall);
    }

    :host(:state(has-description):state(has-support-link)) .description-text {
      margin-inline-end: var(--space-xsmall);
    }

    ::slotted([slot="description"]) {
      display: inline;
    }

    /* Nested fields */
    .nested {
      margin-inline-start: var(--input-nested-offset);
      display: flex;
      flex-direction: column;
    }

    ::slotted([slot="nested"]) {
      margin-block-start: var(--space-large);
    }

    /* Maintain direction in some input types, even when the page is rtl */
    input:is([type="tel"], [type="url"], [type="email"], [type="number"]):not(:placeholder-shown) {
      direction: ltr;
      text-align: match-parent;
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
