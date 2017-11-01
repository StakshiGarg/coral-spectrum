/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

import {transform} from 'coralui-util';

const CLASSNAME = 'coral3-Slider-item';

/**
 @class Coral.Slider.Item
 @classdesc The Slider item
 @htmltag coral-slider-item
 @extends {HTMLElement}
 */
class SliderItem extends HTMLElement {
  /**
   The slider's item value.
   This should contain a number formatted as a string (e.g.: "10") or an empty string.
   
   @type {String}
   @default ""
   @htmlattribute value
   @htmlattributereflected
   */
  get value() {
    return this.getAttribute('value');
  }
  set value(value) {
    this._reflectAttribute('value', transform.string(value));
  }
  
  /**
   The content zone element of the item.
   
   @type {HTMLElement}
   @contentzone
   */
  get content() {
    return this;
  }
  set content(value) {
    if (value instanceof HTMLElement) {
      this.innerHTML = value.innerHTML;
    }
  }
  
  /** @ignore */
  connectedCallback() {
    this.classList.add(CLASSNAME);
  }
}

export default SliderItem;
