/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { css } from 'lit';

/**
 * Shared styles for text-type input elements (text, email, password, etc.)
 */
export const textInputStyles = css`
  input[type='text'],
  input[type='email'],
  input[type='password'],
  input[type='search'],
  input[type='tel'],
  input[type='url'],
  input[type='number'] {
    width: 100%;
    padding: var(--space-small);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-family: inherit;
    font-size: var(--font-size-root);
    color: var(--text-color);
    background-color: var(--background-color-box);
  }

  input:focus {
    outline: var(--focus-outline);
    outline-offset: var(--focus-outline-offset);
    border-color: var(--border-color-selected);
  }

  input:disabled {
    opacity: var(--button-opacity-disabled, 0.5);
    cursor: not-allowed;
  }

  input:read-only {
    background-color: var(--background-color-box-info);
    cursor: default;
  }

  input::placeholder {
    color: var(--text-color-deemphasized);
  }
`;
