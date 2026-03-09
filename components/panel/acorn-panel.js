import { html, css, LitElement } from 'lit';

class AcornPanel extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    type: { type: String, reflect: true },
    side: { type: String, reflect: true },
    anchor: { type: String },
    noAutoDismiss: { type: Boolean, attribute: 'no-auto-dismiss' },
    animate: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      position: fixed;
      z-index: 1000;
      background: var(--arrowpanel-background);
      border: 1px solid var(--arrowpanel-border-color);
      border-radius: var(--arrowpanel-border-radius);
      box-shadow: var(--panel-shadow);
      color: var(--arrowpanel-color);
      padding: var(--panel-subview-body-padding-block, var(--space-medium)) var(--panel-subview-body-padding-inline, 0);
      opacity: 0;
      pointer-events: none;
      transition: opacity 150ms var(--animation-easing-function);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    :host([open]) {
      opacity: 1;
      pointer-events: auto;
    }

    :host([animate]) {
      transition: opacity 150ms var(--animation-easing-function), transform 150ms var(--animation-easing-function);
    }

    :host([type="arrow"]) {
      padding: 0;
    }

    :host([type="arrow"])::before {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border: 8px solid transparent;
    }

    :host([type="arrow"][side="top"])::before {
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: var(--arrowpanel-background);
    }

    :host([type="arrow"][side="bottom"])::before {
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: var(--arrowpanel-background);
    }

    :host([type="arrow"][side="left"])::before {
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: var(--arrowpanel-background);
    }

    :host([type="arrow"][side="right"])::before {
      right: -16px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: var(--arrowpanel-background);
    }

    .panel-content {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
    }

    :host([type="arrow"]) .panel-content {
      padding: var(--panel-subview-body-padding, var(--space-medium));
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.type = 'default';
    this.side = 'bottom';
    this.anchor = null;
    this.noAutoDismiss = false;
    this.animate = true;
    this._anchorElement = null;
    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleEscape = this._handleEscape.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    
    if (this.anchor) {
      this._anchorElement = document.getElementById(this.anchor);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeEventListeners();
  }

  updated(changedProperties) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this._show();
      } else {
        this._hide();
      }
    }

    if (changedProperties.has('anchor')) {
      this._anchorElement = this.anchor ? document.getElementById(this.anchor) : null;
    }
  }

  _show() {
    this._position();
    this._addEventListeners();
    this.dispatchEvent(new CustomEvent('panel-shown', { 
      bubbles: true, 
      composed: true 
    }));
  }

  _hide() {
    this._removeEventListeners();
    this.dispatchEvent(new CustomEvent('panel-hidden', { 
      bubbles: true, 
      composed: true 
    }));
  }

  _position() {
    if (!this._anchorElement) {
      // Center on screen if no anchor
      this.style.left = '50%';
      this.style.top = '50%';
      this.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const anchorRect = this._anchorElement.getBoundingClientRect();
    const panelRect = this.getBoundingClientRect();
    
    let left, top;

    switch (this.side) {
      case 'top':
        left = anchorRect.left + (anchorRect.width / 2) - (panelRect.width / 2);
        top = anchorRect.top - panelRect.height - 8;
        break;
      case 'bottom':
        left = anchorRect.left + (anchorRect.width / 2) - (panelRect.width / 2);
        top = anchorRect.bottom + 8;
        break;
      case 'left':
        left = anchorRect.left - panelRect.width - 8;
        top = anchorRect.top + (anchorRect.height / 2) - (panelRect.height / 2);
        break;
      case 'right':
        left = anchorRect.right + 8;
        top = anchorRect.top + (anchorRect.height / 2) - (panelRect.height / 2);
        break;
      default:
        left = anchorRect.left + (anchorRect.width / 2) - (panelRect.width / 2);
        top = anchorRect.bottom + 8;
    }

    // Keep panel within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = 8;
    if (left + panelRect.width > viewportWidth) {
      left = viewportWidth - panelRect.width - 8;
    }
    if (top < 0) top = 8;
    if (top + panelRect.height > viewportHeight) {
      top = viewportHeight - panelRect.height - 8;
    }

    this.style.left = `${left}px`;
    this.style.top = `${top}px`;
    this.style.transform = 'none';
  }

  _addEventListeners() {
    if (!this.noAutoDismiss) {
      setTimeout(() => {
        document.addEventListener('click', this._handleClickOutside, true);
        document.addEventListener('keydown', this._handleEscape);
      }, 0);
    }
    // Reposition on scroll to keep anchored to element
    if (this._anchorElement) {
      window.addEventListener('scroll', this._handleScroll, true);
      window.addEventListener('resize', this._handleScroll);
    }
  }

  _removeEventListeners() {
    document.removeEventListener('click', this._handleClickOutside, true);
    document.removeEventListener('keydown', this._handleEscape);
    window.removeEventListener('scroll', this._handleScroll, true);
    window.removeEventListener('resize', this._handleScroll);
  }

  _handleClickOutside(event) {
    if (!this.contains(event.target) && 
        (!this._anchorElement || !this._anchorElement.contains(event.target))) {
      this.open = false;
    }
  }

  _handleEscape(event) {
    if (event.key === 'Escape') {
      this.open = false;
    }
  }

  _handleScroll() {
    if (this.open && this._anchorElement) {
      this._position();
    }
  }

  toggle() {
    this.open = !this.open;
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  render() {
    return html`
      <div class="panel-content" part="content">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('acorn-panel', AcornPanel);
