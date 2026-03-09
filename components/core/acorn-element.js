/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement } from 'lit';

/**
 * Helper for query decorator replacement. Used with `static queries` property.
 */
function query(el, selector) {
  return () => el.renderRoot.querySelector(selector);
}

/**
 * Helper for queryAll decorator replacement. Used with `static queries` property.
 */
function queryAll(el, selector) {
  return () => el.renderRoot.querySelectorAll(selector);
}

/**
 * AcornElement provides extensions to the Lit-provided LitElement class.
 *
 * Features:
 * ---------
 * `@query` support (define a getter for a querySelector):
 *
 * static queries = {
 *   propertyName: ".aNormal .cssSelector",
 *   anotherName: { all: ".selectorFor .querySelectorAll" },
 * };
 *
 * This creates properties equivalent to:
 *
 * get propertyName() {
 *   return this.renderRoot?.querySelector(".aNormal .cssSelector");
 * }
 *
 * get anotherName() {
 *   return this.renderRoot?.querySelectorAll(".selectorFor .querySelectorAll");
 * }
 *
 * ---------
 * Test helper for sending events after a change: `dispatchOnUpdateComplete`
 *
 * When async operations are in progress and you want to wait for them in tests,
 * use `this.dispatchOnUpdateComplete(myEvent)` and have the test wait on your event.
 *
 * Example:
 *
 * async onClick() {
 *   let response = await this.getServerResponse(this.data);
 *   this.responseStatus = response.status;
 *   this.dispatchOnUpdateComplete(new CustomEvent("status-shown"));
 * }
 */
export class AcornElement extends LitElement {
  constructor() {
    super();
    const { queries } = this.constructor;
    if (queries) {
      for (const [selectorName, selector] of Object.entries(queries)) {
        if (selector.all) {
          Object.defineProperty(this, selectorName, {
            get: queryAll(this, selector.all),
          });
        } else {
          Object.defineProperty(this, selectorName, {
            get: query(this, selector),
          });
        }
      }
    }
  }

  /**
   * Dispatches an event after the component has completed its update.
   * Useful for testing async operations.
   *
   * @param {Event} event - The event to dispatch
   */
  async dispatchOnUpdateComplete(event) {
    await this.updateComplete;
    this.dispatchEvent(event);
  }
}
