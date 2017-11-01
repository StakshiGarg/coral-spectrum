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
import {transform, validate} from 'coralui-util';

/**
 Enumeration for {@link QuickActionsItem} type values.
 
 @typedef {Object} QuickActionsItemTypeEnum
 
 @property {String} BUTTON
 Default button type
 @property {String} ANCHOR
 Anchor button type
 */
const type = {
  BUTTON: 'button',
  ANCHOR: 'anchor'
};

/**
 @class Coral.QuickActions.Item
 @classdesc A QuickActions item component
 @htmltag coral-quickactions-item
 @extends {HTMLElement}
 @extends {ComponentMixin}
 */
class QuickActionsItem extends ComponentMixin(HTMLElement) {
  /** @ignore */
  constructor() {
    super();
    
    // QuickActions will add button/anchorbutton references to it
    this._elements = {};
  
    this._observer = new MutationObserver(this._onMutation.bind(this));
    this._observer.observe(this, {
      characterData: true,
      childList: true,
      subtree: true
    });
  }
  
  /**
   The Item's content zone.
   
   @type {HTMLElement}
   @contentzone
   */
  get content() {
    return this;
  }
  set content(value) {
    // Support configs
    if (typeof value === 'object') {
      for (const prop in value) {
        this[prop] = value[prop];
      }
    }
  }
  
  /**
   When <code>type</code> is {@link Coral.QuickActions.Item.type.ANCHOR}, the href will be used for the anchor.
   
   @type {String}
   @default ""
   @htmlattribute href
   @htmlattributereflected
   @emits {coral-quickactions-item:_hrefchanged}
   */
  get href() {
    return this._href || '';
  }
  set href(value) {
    this._href = transform.string(value);
    this._reflectAttribute('href', this._href);
    
    this.trigger('coral-quickactions-item:_hrefchanged');
  }
  
  /**
   Specifies the name of the icon to be shown in the QuickActions Item. See {@link Icon} for valid icon
   names.
   
   @type {String}
   @default ""
   @htmlattribute icon
   @htmlattributereflected
   @emits {coral-quickactions-item:_iconchanged}
   */
  get icon() {
    return this._icon || '';
  }
  set icon(value) {
    this._icon = transform.string(value);
    this._reflectAttribute('icon', this._icon);
    
    this.trigger('coral-quickactions-item:_iconchanged');
  }
  
  /**
   The type of item that will be used. Setting {@link QuickActionsItemTypeEnum}.ANCHOR will allow users to
   navigate using the quickactions proving the correct hypermedia to the users.
   
   @type {String}
   @default QuickActionsItemTypeEnum.BUTTON
   @htmlattribute type
   @htmlattributereflected
   */
  get type() {
    return this._type || type.BUTTON;
  }
  set type(value) {
    value = transform.string(value).toLowerCase();
    this._type = validate.enumeration(type)(value) && value || type.BUTTON;
    this._reflectAttribute('type', this._type);
    
    this.trigger('coral-quickactions-item:_typechanged');
  }
  
  /**
   Handles mutations on the Item.
   
   @emits {coral-quickactions-item:_contentchanged}
   
   @private
   */
  _onMutation() {
    this.trigger('coral-quickactions-item:_contentchanged');
  }
  
  /**
   Returns {@link QuickActionsItem} type options.
   
   @return {QuickActionsItemTypeEnum}
   */
  static get type() { return type; }
  
  /** @ignore */
  static get observedAttributes() { return ['href', 'icon', 'type']; }
  
  /** @ignore */
  connectedCallback() {
    super.connectedCallback();
    
    // Default reflected attributes
    if (!this._type) { this.type = type.BUTTON; }
  }
  
  /**
   Triggered when an icon of a {@link QuickActionsItem} was changed.
   
   @typedef {CustomEvent} coral-quickactions-item:_iconchanged
   
   @private
   */
  
  /**
   Triggered when the content of a {@link QuickActionsItem} was changed.
   
   @typedef {CustomEvent} coral-quickactions-item:_contentchanged
   
   @private
   */
  
  /**
   Triggered when the href of a {@link QuickActionsItem} was changed.
   
   @typedef {CustomEvent} coral-quickactions-item:_hrefchanged
   
   @private
   */
  
  /**
   Triggered when the type of a {@link QuickActionsItem} was changed.
   
   @typedef {CustomEvent} coral-quickactions-item:_typechanged
   
   @private
   */
}

export default QuickActionsItem;
