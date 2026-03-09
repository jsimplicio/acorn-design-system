import { html, css, LitElement } from 'lit';

class AcornToolbarbutton extends LitElement {
  static properties = {
    label: { type: String },
    icon: { type: String },
    disabled: { type: Boolean, reflect: true },
    checked: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      appearance: none;
      margin: var(--arrowpanel-menuitem-margin);
      min-height: 24px;
      padding: var(--arrowpanel-menuitem-padding);
      border-radius: var(--arrowpanel-menuitem-border-radius);
      background-color: var(--button-background-color-ghost);
      color: var(--button-text-color-ghost);
      border: 0;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
      gap: var(--space-small);
    }

    :host(:focus-visible) {
      outline: var(--focus-outline);
      outline-offset: var(--focus-outline-inset);
    }

    :host([disabled]) {
      color: var(--button-text-color-ghost-disabled);
      background-color: var(--button-background-color-ghost-disabled);
      opacity: var(--button-opacity-disabled);
      cursor: not-allowed;
    }

    :host(:not([disabled]):hover) {
      color: var(--button-text-color-ghost-hover);
      background-color: var(--button-background-color-ghost-hover);
    }

    :host(:not([disabled]):hover:active) {
      color: var(--button-text-color-ghost-active);
      background-color: var(--button-background-color-ghost-active);
    }

    .toolbarbutton-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      -moz-context-properties: fill;
      fill: currentColor;
      display: none;
    }

    :host([icon]) .toolbarbutton-icon {
      display: block;
    }

    :host([checked]) .toolbarbutton-icon {
      display: block;
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="context-fill" d="M6.5 12L2 7.5l1.5-1.5L6.5 9l6-6L14 4.5z"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }

    .toolbarbutton-text {
      flex: 1;
      text-align: start;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  constructor() {
    super();
    this.label = '';
    this.icon = '';
    this.disabled = false;
    this.checked = false;
  }

  _handleClick(e) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    this.dispatchEvent(new CustomEvent('toolbarbutton-click', {
      bubbles: true,
      composed: true,
      detail: { label: this.label }
    }));
  }

  render() {
    return html`
      <div class="toolbarbutton-icon" style="${this.icon && !this.checked ? `background-image: url(${this.icon})` : ''}"></div>
      <span class="toolbarbutton-text">${this.label || html`<slot></slot>`}</span>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'menuitem');
    this.setAttribute('tabindex', this.disabled ? '-1' : '0');
    this.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleClick);
  }

  updated(changedProperties) {
    if (changedProperties.has('disabled')) {
      this.setAttribute('tabindex', this.disabled ? '-1' : '0');
    }
  }
}

customElements.define('acorn-toolbarbutton', AcornToolbarbutton);
