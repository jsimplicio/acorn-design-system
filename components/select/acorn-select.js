import { html, css } from 'lit';
import { AcornBaseInputElement } from '../input/acorn-base-input.js';

/**
 * Select dropdown with options
 * 
 * @tagname acorn-select
 * @property {string} label - Label for the select
 * @property {string} value - Currently selected value
 * @property {string} placeholder - Placeholder text
 * @property {boolean} disabled - Whether select is disabled
 * @property {array} options - The array of options from panel-item children
 */
class AcornSelect extends AcornBaseInputElement {
  static properties = {
    placeholder: { type: String },
    options: { type: Array, state: true },
  };

  static inputLayout = 'block';

  static styles = [
    AcornBaseInputElement.styles,
    css`
    :host {
      --select-border: var(--button-border);
      --select-border-radius: var(--button-border-radius);
      --select-border-color-hover: var(--button-border-color-hover);
      --select-border-color-disabled: var(--button-border-color-disabled);
      --select-background-color: var(--button-background-color);
      --select-background-color-hover: var(--button-background-color-hover);
      --select-background-color-disabled: var(--button-background-color-disabled);
      --select-opacity-disabled: var(--button-opacity-disabled);
      --select-margin-block: var(--input-margin-block-adjust);
      --select-margin-inline: var(--input-margin-inline-start-adjust) var(--space-small);
      --select-min-height: var(--button-min-height);
      --select-font-size: var(--button-font-size);
      --select-font-weight: var(--button-font-weight);
      --select-text-color: var(--button-text-color);
      --select-text-color-hover: var(--button-text-color-hover);
      --select-text-color-disabled: var(--button-text-color-disabled);
      --select-icon-fill: var(--button-icon-fill);
    }

    .select-wrapper {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      border: var(--select-border);
      border-radius: var(--select-border-radius);
      background-color: var(--select-background-color);
      color: var(--select-text-color);
      margin-block: var(--select-margin-block);
      margin-inline: var(--select-margin-inline);
      min-width: var(--select-min-width);
      max-width: var(--select-max-width);
    }

    .select-wrapper:hover {
      border-color: var(--select-border-color-hover);
      background-color: var(--select-background-color-hover);
      color: var(--select-text-color-hover);
    }

    .select-wrapper:has(:disabled) {
      border-color: var(--select-border-color-disabled);
      background-color: var(--select-background-color-disabled);
      color: var(--select-text-color-disabled);
      opacity: var(--select-opacity-disabled);
      cursor: not-allowed;
    }

    .select-wrapper:has(:focus-visible) {
      outline: var(--focus-outline);
      outline-offset: var(--focus-outline-offset);
    }

    .panel-trigger {
      display: flex;
      align-items: center;
      outline: none;
      font-family: inherit;
      border-radius: var(--select-border-radius);
      padding-inline: var(--space-large) var(--space-xxlarge);
      min-height: var(--select-min-height);
      width: 100%;
      font-size: var(--select-font-size);
      font-weight: var(--select-font-weight);
      background-color: transparent;
      color: inherit;
      appearance: none;
      border: none;
      cursor: pointer;
    }

    .select-option-icon,
    .select-chevron-icon {
      position: absolute;
      width: var(--icon-size);
      height: var(--icon-size);
      pointer-events: none;
    }

    .select-option-icon {
      inset-inline-start: var(--space-large);
      opacity: 0;
      transform: scale(0);
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    }

    @media (prefers-reduced-motion) {
      .select-option-icon {
        transition: unset;
      }
    }

    .select-chevron-icon {
      inset-inline-end: var(--space-medium);
    }

    .with-icon .panel-trigger {
      padding-inline-start: calc(var(--space-large) + var(--icon-size) + var(--space-small));
    }

    .with-icon .select-option-icon {
      opacity: 1;
      transform: scale(1);
    }
  `,
  ];

  constructor() {
    super();
    this.value = '';
    this.placeholder = 'Select an option';
    this.options = [];
    this._panelList = null;
    this._selectedLabel = '';
    this._selectedIcon = '';
    this._handleButtonClick = this._handleButtonClick.bind(this);
  }


  _handleSelection(e) {
    if (e.detail && e.detail.value) {
      this.value = e.detail.value;
      this._updateSelectedDisplay();
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      }));
    }
  }

  firstUpdated() {
    super.firstUpdated();
    // Get panel-list directly from children (light DOM)
    this._panelList = Array.from(this.children).find(
      el => el.tagName === 'ACORN-PANEL-LIST'
    );
    if (this._panelList) {
      this._panelList.addEventListener('click', this._handleSelection.bind(this));
      this._updateSelectedDisplay();
    }
  }

  _handleButtonClick(e) {
    if (this.disabled) return;
    
    if (!this._panelList) {
      // Get panel-list directly from children (light DOM)
      this._panelList = Array.from(this.children).find(
        el => el.tagName === 'ACORN-PANEL-LIST'
      );
    }
    
    if (this._panelList) {
      // Position relative to the select-wrapper element
      const wrapper = this.renderRoot.querySelector('.select-wrapper');
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        this._panelList.style.left = `${rect.left}px`;
        this._panelList.style.top = `${rect.bottom + 4}px`;
        this._panelList.style.minWidth = `${rect.width}px`;
      }
      this._panelList.open = !this._panelList.open;
    }
  }

  _updateSelectedDisplay() {
    const options = this.querySelectorAll('acorn-panel-item');
    const selectedOption = Array.from(options).find(opt => opt.value === this.value);
    
    if (selectedOption) {
      this._selectedLabel = selectedOption.textContent.trim();
      this._selectedIcon = selectedOption.icon || '';
      selectedOption.selected = true;
      
      // Clear selected from other options
      options.forEach(opt => {
        if (opt !== selectedOption) {
          opt.selected = false;
        }
      });
    }
    
    this.requestUpdate();
  }

  inputTemplate() {
    const displayText = this._selectedLabel || this.placeholder;
    const hasIcon = !!this._selectedIcon;

    return html`
      <div class="select-wrapper ${hasIcon ? 'with-icon' : ''}">
        ${hasIcon ? html`<img src="${this._selectedIcon}" class="select-option-icon" />` : ''}
        <div 
          class="panel-trigger"
          @click=${this._handleButtonClick}
          role="button"
          tabindex="${this.disabled ? -1 : 0}"
          ?disabled="${this.disabled}"
        >
          ${displayText}
        </div>
        <span class="select-chevron-icon">
	  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke="currentColor" stroke-width="2" d="m5 10 7 7 7-7"/></svg>
	</span>
      </div>
    `;
  }

  render() {
    return html`
      ${super.render()}
      <slot></slot>
    `;
  }
}

customElements.define('acorn-select', AcornSelect);
