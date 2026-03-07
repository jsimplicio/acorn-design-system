/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';
import { AcornElement } from '../core/acorn-element.js';

/**
 * A button with multiple types and two sizes.
 *
 * @tagname acorn-button
 * @property {string} label - The button's label, will be overridden by slotted content
 * @property {string} type - The button type: default, primary, destructive, icon, icon ghost, ghost
 * @property {string} size - The button size: default, small
 * @property {boolean} disabled - The disabled state
 * @property {string} title - The button's title attribute
 * @property {string} ariaLabel - The button's aria-label attribute
 * @property {string} ariaPressed - The button's aria-pressed attribute
 * @property {string} iconSrc - Path to the icon that should be displayed in the button
 * @property {boolean} attention - Show a dot notification on the button if true
 * @property {string} iconPosition - The icon's position relative to the button label: start, end
 * @fires click - The click event
 */
export class AcornButton extends AcornElement {
  static shadowRootOptions = {
    ...AcornElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static properties = {
    label: { type: String },
    type: { type: String, reflect: true },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    title: { type: String },
    ariaLabel: { type: String },
    ariaPressed: { type: String },
    iconSrc: { type: String },
    hasVisibleLabel: { type: Boolean, state: true },
    attention: { type: Boolean },
    iconPosition: { type: String, reflect: true },
  };

  static queries = {
    buttonEl: '#button',
    slotEl: 'slot',
  };

  static styles = css`
    :host {
      display: inline-block;
      height: fit-content;
      width: fit-content;
      --button-alignment: center;
    }

    :host([hidden]) {
      display: none !important;
    }

    button {
      appearance: none;
      background: transparent;
      border: none;
      font: inherit;
      color: inherit;
      width: 100%;
      padding: 0;
      cursor: pointer;
    }

    button:focus-visible {
      outline: none;
    }

    button:disabled {
      cursor: not-allowed;
    }

    .button-background {
      box-sizing: border-box;
      min-height: var(--button-min-height);
      border: var(--button-border);
      border-radius: var(--button-border-radius);
      background-color: var(--button-background-color);
      color: var(--button-text-color);
      padding: var(--button-padding);
      font-weight: var(--button-font-weight);
      font-size: var(--button-font-size);
      display: flex;
      justify-content: var(--button-alignment);
      align-items: center;
      position: relative;
    }

    .button-background.size-small {
      min-height: var(--button-min-height-small);
      padding-block: var(--space-xxsmall);
      font-size: var(--button-font-size-small);
    }

    .button-background.badged::after {
      content: '';
      position: absolute;
      height: 6px;
      width: 6px;
      inset-block-start: var(--space-xxsmall);
      inset-inline-end: var(--space-xxsmall);
      background-color: var(--attention-dot-color);
      border-radius: var(--border-radius-circle);
    }

    button:hover > .button-background {
      background-color: var(--button-background-color-hover);
      border-color: var(--button-border-color-hover);
      color: var(--button-text-color-hover);
    }

    button:hover:active:not(:disabled) > .button-background {
      background-color: var(--button-background-color-active);
      border-color: var(--button-border-color-active);
      color: var(--button-text-color-active);
    }

    button[aria-pressed='true']:not(:hover, :disabled) > .button-background {
      background-color: var(--button-background-color-selected);
      border-color: var(--button-border-color-selected);
      color: var(--button-text-color-selected);
    }

    button:disabled > .button-background {
      background-color: var(--button-background-color-disabled);
      border-color: var(--button-border-color-disabled);
      color: var(--button-text-color-disabled);
      opacity: var(--button-opacity-disabled);
    }

    button:focus-visible > .button-background {
      outline: var(--focus-outline);
      outline-offset: var(--focus-outline-offset);
    }

    /* Primary type */
    :host([type='primary']) .button-background {
      background-color: var(--button-background-color-primary);
      border-color: var(--button-border-color-primary);
      color: var(--button-text-color-primary);
    }

    :host([type='primary']) button:hover > .button-background {
      background-color: var(--button-background-color-primary-hover);
      border-color: var(--button-border-color-primary-hover);
      color: var(--button-text-color-primary-hover);
    }

    :host([type='primary'])
      button:hover:active:not(:disabled)
      > .button-background {
      background-color: var(--button-background-color-primary-active);
      border-color: var(--button-border-color-primary-active);
      color: var(--button-text-color-primary-active);
    }

    :host([type='primary']) button:disabled > .button-background {
      background-color: var(--button-background-color-primary-disabled);
      border-color: var(--button-border-color-primary-disabled);
      color: var(--button-text-color-primary-disabled);
    }

    /* Destructive type */
    :host([type='destructive']) .button-background {
      background-color: var(--button-background-color-destructive);
      border-color: var(--button-border-color-destructive);
      color: var(--button-text-color-destructive);
    }

    :host([type='destructive']) button:hover > .button-background {
      background-color: var(--button-background-color-destructive-hover);
      border-color: var(--button-border-color-destructive-hover);
      color: var(--button-text-color-destructive-hover);
    }

    :host([type='destructive'])
      button:hover:active:not(:disabled)
      > .button-background {
      background-color: var(--button-background-color-destructive-active);
      border-color: var(--button-border-color-destructive-active);
      color: var(--button-text-color-destructive-active);
    }

    :host([type='destructive']) button:disabled > .button-background {
      background-color: var(--button-background-color-destructive-disabled);
      border-color: var(--button-border-color-destructive-disabled);
      color: var(--button-text-color-destructive-disabled);
    }

    /* Ghost type */
    :host([type*='ghost']) .button-background {
      background-color: var(--button-background-color-ghost);
      border-color: var(--button-border-color-ghost);
      color: var(--button-text-color-ghost);
    }

    :host([type*='ghost']) button:hover > .button-background {
      background-color: var(--button-background-color-ghost-hover);
      border-color: var(--button-border-color-ghost-hover);
      color: var(--button-text-color-ghost-hover);
    }

    :host([type*='ghost'])
      button:hover:active:not(:disabled)
      > .button-background {
      background-color: var(--button-background-color-ghost-active);
      border-color: var(--button-border-color-ghost-active);
      color: var(--button-text-color-ghost-active);
    }

    :host([type*='ghost']) button:disabled > .button-background {
      background-color: var(--button-background-color-ghost-disabled);
      border-color: var(--button-border-color-ghost-disabled);
      color: var(--button-text-color-ghost-disabled);
    }

    .button-background.labelled {
      gap: var(--space-small);
    }

    /* Icon button without label */
    :host([type*='icon']) .button-background:not(.labelled) {
      width: var(--button-size-icon);
      height: var(--button-size-icon);
      padding: var(--button-padding-icon);
    }

    :host([type*='icon'][size='small']) .button-background:not(.labelled) {
      width: var(--button-size-icon-small);
      height: var(--button-size-icon-small);
    }

    img {
      width: var(--icon-size);
      height: var(--icon-size);
      fill: var(--button-icon-fill);
      stroke: var(--button-icon-stroke);
      pointer-events: none;
    }

    .label {
      display: contents;
    }
  `;

  constructor() {
    super();
    this.type = 'default';
    this.size = 'default';
    this.disabled = false;
    this.hasVisibleLabel = !!this.label;
    this.attention = false;
    this.iconPosition = 'start';
  }

  click() {
    this.buttonEl.click();
  }

  checkForLabelText() {
    this.hasVisibleLabel = this.slotEl
      ?.assignedNodes()
      .some((node) => node.textContent?.trim());
  }

  labelTemplate() {
    if (this.label) {
      return this.label;
    }
    return html`<slot @slotchange=${this.checkForLabelText}></slot>`;
  }

  iconTemplate(position) {
    if (this.iconSrc && position === this.iconPosition) {
      return html`<img src=${this.iconSrc} alt="" role="presentation" />`;
    }
    return null;
  }

  render() {
    return html`
      <button
        id="button"
        ?disabled=${this.disabled}
        title=${ifDefined(this.title)}
        aria-label=${ifDefined(this.ariaLabel)}
        aria-pressed=${ifDefined(this.ariaPressed)}
      >
        <span
          class=${classMap({
            'button-background': true,
            labelled: this.label || this.hasVisibleLabel,
            badged: this.iconSrc && this.attention,
            [`size-${this.size}`]: this.size !== 'default',
          })}
          part="button"
        >
          ${this.iconTemplate('start')}
          <span class="label">${this.labelTemplate()}</span>
          ${this.iconTemplate('end')}
        </span>
      </button>
    `;
  }
}

customElements.define('acorn-button', AcornButton);
