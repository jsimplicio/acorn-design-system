import { html, css, LitElement } from 'lit';

/**
 * Panel list component - a menu list that appears in a panel
 * 
 * @tagname acorn-panel-list
 * @property {string} value - Currently selected value
 * @property {boolean} open - Whether the panel is open
 */
class AcornPanelList extends LitElement {
  static properties = {
    value: { type: String },
    open: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: none;
      position: fixed;
      background: var(--arrowpanel-background);
      border: 1px solid var(--arrowpanel-border-color);
      border-radius: var(--arrowpanel-border-radius);
      box-shadow: var(--panel-shadow);
      color: var(--arrowpanel-color);
      padding: var(--panel-subview-body-padding-block) var(--panel-subview-body-padding-inline);
      min-width: 200px;
      z-index: 1000;
    }

    :host([open]) {
      display: block;
    }

    ::slotted(acorn-panel-item) {
      display: block;
    }
  `;

  constructor() {
    super();
    this.value = '';
    this.open = false;
    this._triggerElement = null;
    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleEscape = this._handleEscape.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
  }

  updated(changedProperties) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this._addEventListeners();
      } else {
        this._removeEventListeners();
      }
    }
  }

  toggle(event) {
    this.open = !this.open;
    
    if (this.open && event) {
      this._triggerElement = event.target;
      this._positionPanel(event);
    }
  }

  _positionPanel(event) {
    if (!event || !event.target) return;
    
    // Use requestAnimationFrame to ensure positioning happens after layout
    requestAnimationFrame(() => {
      const trigger = event.target;
      const triggerRect = trigger.getBoundingClientRect();
      
      // Only position if the trigger is visible
      if (triggerRect.width > 0 && triggerRect.height > 0) {
        this.style.left = `${triggerRect.left}px`;
        this.style.top = `${triggerRect.bottom + 4}px`;
        this.style.minWidth = `${triggerRect.width}px`;
      }
    });
  }

  _addEventListeners() {
    setTimeout(() => {
      document.addEventListener('click', this._handleClickOutside, true);
      document.addEventListener('keydown', this._handleEscape);
      window.addEventListener('scroll', this._handleScroll, true);
    }, 0);
  }

  _removeEventListeners() {
    document.removeEventListener('click', this._handleClickOutside, true);
    document.removeEventListener('keydown', this._handleEscape);
    window.removeEventListener('scroll', this._handleScroll, true);
  }

  _handleClickOutside(event) {
    if (!this.contains(event.target)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent('hidden', { bubbles: true, composed: true }));
    }
  }

  _handleEscape(event) {
    if (event.key === 'Escape') {
      this.open = false;
      this.dispatchEvent(new CustomEvent('hidden', { bubbles: true, composed: true }));
    }
  }

  _handleScroll() {
    // Reposition on scroll to stay anchored to trigger
    if (this.open && this._triggerElement) {
      const triggerRect = this._triggerElement.getBoundingClientRect();
      if (triggerRect.width > 0 && triggerRect.height > 0) {
        this.style.left = `${triggerRect.left}px`;
        this.style.top = `${triggerRect.bottom + 4}px`;
      }
    }
  }

  _handleItemClick(e) {
    if (e.target.tagName === 'ACORN-PANEL-ITEM') {
      this.value = e.target.value;
      this.open = false;
      this.dispatchEvent(new CustomEvent('click', {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      }));
      this.dispatchEvent(new CustomEvent('hidden', { bubbles: true, composed: true }));
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeEventListeners();
  }

  render() {
    return html`
      <slot @click=${this._handleItemClick}></slot>
    `;
  }
}

/**
 * Panel item component - an item in a panel list
 * 
 * @tagname acorn-panel-item
 * @property {string} value - Value of the item
 * @property {boolean} selected - Whether item is selected
 * @property {boolean} disabled - Whether item is disabled
 * @property {string} icon - Icon URL for the item
 */
class AcornPanelItem extends LitElement {
  static properties = {
    value: { type: String },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    icon: { type: String },
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
      cursor: pointer;
      user-select: none;
      gap: var(--space-small);
    }

    :host([selected]) {
      background-color: var(--button-background-color-ghost-hover);
    }

    :host([disabled]) {
      color: var(--button-text-color-ghost-disabled);
      opacity: var(--button-opacity-disabled);
      cursor: not-allowed;
    }

    :host(:not([disabled]):hover) {
      color: var(--button-text-color-ghost-hover);
      background-color: var(--button-background-color-ghost-hover);
    }

    :host(:not([disabled]):active) {
      color: var(--button-text-color-ghost-active);
      background-color: var(--button-background-color-ghost-active);
    }

    .panel-item-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      display: none;
    }

    :host([icon]) .panel-item-icon {
      display: block;
    }

    .panel-item-text {
      flex: 1;
    }
  `;

  constructor() {
    super();
    this.value = '';
    this.selected = false;
    this.disabled = false;
    this.icon = '';
  }

  render() {
    return html`
      ${this.icon ? html`<img src="${this.icon}" class="panel-item-icon" />` : ''}
      <span class="panel-item-text"><slot></slot></span>
    `;
  }
}

customElements.define('acorn-panel-list', AcornPanelList);
customElements.define('acorn-panel-item', AcornPanelItem);
