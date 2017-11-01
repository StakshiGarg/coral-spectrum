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

import Collection from './Collection';
import listToArray from './listToArray';

/**
 Collection capable of handling non-nested items with a selected attribute. It is useful to manage the
 internal state of selection. It currently does not support options.filter for the selection related functions.
 */
class SelectableCollection extends Collection {
  constructor(options) {
    super(options);
  
    if (this._filter) {
      console.warn('Coral.SelectableCollection does not support the options.filter');
    }
  
    // disabled items will not be a selection candicate although hidden items might
    this._selectableItemSelector = this._allItemsSelector.split(',').map(selector => `${selector}:not([disabled])`).join(',');
    this._selectedItemSelector = this._allItemsSelector.split(',').map(selector => `${selector}[selected]`).join(',');
    this._deselectAllExceptSelector = this._selectedItemSelector;
  }
  
  /**
   Returns the selectable items. Items that are disabled quality for selection. On the other hand, hidden items
   can be selected as this is the default behavior in HTML. Please note that an already selected item could be
   returned, since the selection could be toggled.
   
   @returns {Array.<HTMLElement>}
   an array of items whose selection could be toggled.
   
   @protected
   */
  _getSelectableItems() {
    return listToArray(this._host.querySelectorAll(this._selectableItemSelector));
  }
  
  /**
   Returns the first selectable item. Items that are disabled quality for selection. On the other hand, hidden items
   can be selected as this is the default behavior in HTML. Please note that an already selected item could be
   returned, since the selection could be toggled.
   
   @returns {HTMLElement}
   an item whose selection could be toggled.
   
   @protected
   */
  _getFirstSelectable() {
    return this._host.querySelector(this._selectableItemSelector) || null;
  }
  
  /**
   Returns the last selectable item. Items that are disabled quality for selection. On the other hand, hidden items
   can be selected as this is the default behavior in HTML. Please note that an already selected item could be
   returned, since the selection could be toggled.
   
   @returns {HTMLElement}
   an item whose selection could be toggled.
   
   @protected
   */
  _getLastSelectable() {
    const items = this._host.querySelectorAll(this._selectableItemSelector);
    return items[items.length - 1] || null;
  }
  
  /**
   Returns the previous selectable item.
 
   @param {HTMLElement} item
   The reference item.
   
   @returns {HTMLElement}
   an item whose selection could be toggled.
   
   @protected
   */
  _getPreviousSelectable(item) {
    let sibling = item.previousElementSibling;
    while (sibling) {
      if (sibling.matches(this._selectableItemSelector)) {
        break;
      }
      else {
        sibling = sibling.previousElementSibling;
      }
    }
    
    return sibling || item;
  }
  
  /**
   Returns the net selectable item.
   
   @param {HTMLElement} item
   The reference item.
   
   @returns {HTMLElement}
   an item whose selection could be toggled.
   
   @protected
   */
  _getNextSelectable(item) {
    let sibling = item.nextElementSibling;
    while (sibling) {
      if (sibling.matches(this._selectableItemSelector)) {
        break;
      }
      else {
        sibling = sibling.nextElementSibling;
      }
    }
    
    return sibling || item;
  }
  
  /**
   Returns the first item that is selected in the Collection. It allows to configure the attribute used for selection
   so that components that use 'selected' and 'active' can share the same implementation.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection.
   
   @returns HTMLElement the first selected item.
   
   @protected
   */
  _getFirstSelected(selectedAttribute) {
    let selector = this._selectedItemSelector;
  
    if (typeof selectedAttribute === 'string') {
      selector = selector.replace('[selected]', `[${selectedAttribute}]`);
    }
  
    return this._host.querySelector(selector) || null;
  }
  
  /**
   Returns the last item that is selected in the Collection. It allows to configure the attribute used for selection
   so that components that use 'selected' and 'active' can share the same implementation.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection.
   
   @returns HTMLElment the last selected item.
   
   @protected
   */
  _getLastSelected(selectedAttribute) {
    let selector = this._selectedItemSelector;
  
    if (typeof selectedAttribute === 'string') {
      selector = selector.replace('[selected]', `[${selectedAttribute}]`);
    }
  
    // last-of-type did not work so we need to query all
    const items = this._host.querySelectorAll(selector);
    return items[items.length - 1] || null;
  }
  
  /**
   Returns an array that contains all the items that are selected.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection.
   
   @protected
   
   @returns Array.<HTMLElement> an array with all the selected items.
   */
  _getAllSelected(selectedAttribute) {
    let selector = this._selectedItemSelector;
  
    if (typeof selectedAttribute === 'string') {
      selector = selector.replace('[selected]', `[${selectedAttribute}]`);
    }
  
    return listToArray(this._host.querySelectorAll(selector));
  }
  
  /**
   Deselects all the items except the first selected item in the Collection. By default the <code>selected</code>
   attribute will be removed. The attribute to remove is configurable via the <code>selectedAttribute</code> parameter.
   The selected attribute will be removed no matter if the item is <code>disabled</code> or <code>hidden</code>.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection. This attribute will be removed from the matching elements.
   
   @protected
   */
  _deselectAllExceptFirst(selectedAttribute) {
    let selector = this._deselectAllExceptSelector;
    const attributeToRemove = selectedAttribute || 'selected';
  
    if (typeof selectedAttribute === 'string') {
      selector = selector.replace('[selected]', `[${selectedAttribute}]`);
    }
  
    // we select all the selected attributes except the last one
    const items = this._host.querySelectorAll(selector);
    const itemsCount = items.length;
  
    // ignores the first item of the list, everything else is deselected
    for (let i = 1; i < itemsCount; i++) {
      // we use remoteAttribute since we do not know if the element is upgraded
      items[i].removeAttribute(attributeToRemove);
    }
  }
  
  /**
   Deselects all the items except the last selected item in the Collecton. By default the <code>selected</code>
   attribute will be removed. The attribute to remove is configurable via the <code>selectedAttribute</code> parameter.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection. This attribute will be removed from the matching elements.
   
   @protected
   */
  _deselectAllExceptLast(selectedAttribute) {
    let selector = this._deselectAllExceptSelector;
    const attributeToRemove = selectedAttribute || 'selected';
  
    if (typeof selectedAttribute === 'string') {
      selector = selector.replace('[selected]', `[${selectedAttribute}]`);
    }
  
    // we query for all matching items with the given attribute
    const items = this._host.querySelectorAll(selector);
    // we ignore the last item
    const itemsCount = items.length - 1;
  
    for (let i = 0; i < itemsCount; i++) {
      // we use remoteAttribute since we do not know if the element is upgraded
      items[i].removeAttribute(attributeToRemove);
    }
  }
  
  /**
   Deselects all the items except the given item. The provided attribute will be remove from all matching items. By
   default the <code>selected</code> attribute will be removed. The attribute to remove is configurable via the
   <code>selectedAttribute</code> parameter.
   
   @name Coral.SelectableCollection#_deselectAllExcept
   @function
   
   @param {HTMLElement} [itemOrSelectedAttribute]
   The item to keep selected. If the item is not provided, all elements will be deselected.
   
   @param {String} [selectedAttribute=selected]
   the attribute that will be used to check for selection. This attribute will be removed from the matching elements.
   
   @protected
   */
  _deselectAllExcept(itemOrSelectedAttribute, selectedAttribute) {
    // if no selectedAttribute we use the unmodified selector as default
    let selector = this._deselectAllExceptSelector;
  
    let item;
    let attributeToRemove;
    // an item was not provided so we use it as 'selectedAttribute'
    if (typeof itemOrSelectedAttribute === 'string') {
      item = null;
      attributeToRemove = itemOrSelectedAttribute || 'selected';
      selector = selector.replace('[selected]', `[${attributeToRemove}]`);
    }
    else {
      item = itemOrSelectedAttribute;
      attributeToRemove = selectedAttribute || 'selected';
    
      if (typeof selectedAttribute === 'string') {
        selector = selector.replace('[selected]', `[${attributeToRemove}]`);
      }
    }
  
    // we query for all matching items with the given attribute
    const items = this._host.querySelectorAll(selector);
    const itemsCount = items.length;
  
    for (let i = 0; i < itemsCount; i++) {
      // we use remoteAttribute since we do not know if the element is upgraded
      if (item !== items[i]) {
        items[i].removeAttribute(attributeToRemove);
      }
    }
  }
}

export default SelectableCollection;
