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

import {ComponentMixin} from 'coralui-mixin-component';
import {ListMixin} from 'coralui-mixin-list';

const CLASSNAME = 'coral3-ButtonList';

/**
 @class Coral.ButtonList
 @classdesc An ButtonList component
 @htmltag coral-buttonlist
 @extends {HTMLElement}
 @extends {ComponentMixin}
 @extends {ListMixin}
 */
class ButtonList extends ListMixin(ComponentMixin(HTMLElement)) {
  /** @ignore */
  constructor() {
    super();
  
    // Events
    this._delegateEvents(this._events);
  }
  
  /** @private */
  get _itemTagName() {
    // Used for Collection
    return 'coral-buttonlist-item';
  }
  
  /** @private */
  get _itemBaseTagName() {
    // Used for Collection
    return 'button';
  }
  
  /** @ignore */
  connectedCallback() {
    super.connectedCallback();
    
    this.classList.add(CLASSNAME);
  }
}

export default ButtonList;
