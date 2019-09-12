/**
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {BaseComponent} from '../../../coral-base-component';
import MasonryItem from './MasonryItem';
import {SelectableCollection} from '../../../coral-collection';
import {validate, transform, commons} from '../../../coral-utils';

const CLASSNAME = '_coral-Masonry';

/**
 Enumeration for {@link Masonry} selection options.
 
 @typedef {Object} MasonrySelectionModeEnum
 
 @property {String} NONE
 None is default, selection of Masonry items doesn't happen based on click.
 @property {String} SINGLE
 Single selection mode, Masonry behaves like radio input elements.
 @property {String} MULTIPLE
 Multiple selection mode, Masonry behaves like checkbox input elements.
 */
const selectionMode = {
  NONE: 'none',
  SINGLE: 'single',
  MULTIPLE: 'multiple'
};

/**
 Enumeration for {@link Masonry} layouts.
 
 @typedef {Object} MasonryLayoutsEnum
 
 @property {String} FIXED_CENTERED
 A Layout with fixed width centered items.
 @property {String} FIXED_SPREAD
 A layout with fixed width and evenly spread items.
 @property {String} VARIABLE
 A layout with variable width items.
 @property {String} DASHBOARD
 A layout with variable width items which are expanded in their height to fill gaps.
 */
const layouts = {
  FIXED_CENTERED: 'fixed-centered',
  FIXED_SPREAD: 'fixed-spread',
  VARIABLE: 'variable',
  DASHBOARD: 'dashboard'
};

// IE does not set the complete property to true if an image cannot be loaded. This code must be outside of the
// masonry to make sure that the listener catches images which fail loading before the masonry is initalized.
// @polyfill ie11
document.addEventListener('error', (event) => {
  const target = event.target;
  if (target && target.tagName === 'IMG') {
    target._loadError = true;
  }
}, true);

// Ignore children which are being removed
const itemFilter = (element) => element && element.tagName === 'CORAL-MASONRY-ITEM' && !element.hasAttribute('_removing');

// Filter out items being removed
const isRemovingOrRemoved = (item) => item.hasAttribute('_removing') || !item.parentNode;

/**
 * Returns the position of the second element relative to the first element.
 */
const relativePosition = (el1, el2) => {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  return {
    left: rect2.left - rect1.left,
    top: rect2.top - rect1.top
  };
};

const weightedDistance = (x1, y1, x2, y2, unitWidth, unitHeight) => Math.sqrt(Math.pow((x2 - x1) / unitWidth, 2) + Math.pow((y2 - y1) / unitHeight, 2));

const getPreviousItem = (item) => {
  const previousItem = item.previousElementSibling;
  return itemFilter(previousItem) ? previousItem : null;
};

/**
 @class Coral.Masonry
 @classdesc A Masonry component that allows to lay out items in a masonry grid.
 @htmltag coral-masonry
 @extends {HTMLElement}
 @extends {BaseComponent}
 */
class Masonry extends BaseComponent(HTMLElement) {
  /** @ignore */
  constructor() {
    super();
  
    // Defaults
    this._loaded = false;
    this._layouted = false;
    this._layoutScheduled = false;
    this._forceDebounce = false;
    this._debounceId = null;
  
    this._newItems = [];
    this._tabbableItem = null;
    
    this._delegateEvents({
      'global:resize': '_onWindowResize',
  
      // Loaded
      'global:load': '_updateLoaded',
      'capture:load img': '_updateLoaded',
      'capture:error img': '_updateLoaded',
  
      // Drag and drop
      'coral-dragaction:dragstart coral-masonry-item': '_onItemDragStart',
      'coral-dragaction:dragover coral-masonry-item': '_onItemDragMove',
      'coral-dragaction:dragend coral-masonry-item': '_onItemDragEnd',
  
      // Keyboard
      'capture:focus coral-masonry-item': '_onItemFocus',
      
      // Selection
      'click coral-masonry-item': '_onItemClick',
      'key:space coral-masonry-item': '_onItemClick',
      
      // private
      'coral-masonry-item:_connected': '_onItemConnected',
      'coral-masonry-item:_selectedchanged': '_onItemSelectedChanged'
    });
  
    // Relayout when child elements change or are added/removed
    // Should this mutation observer become a bottleneck, it could be replaced with a resize listener
    this._observer = new MutationObserver(this._scheduleLayout.bind(this, 'mutation'));
    this._observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  
    // Used for eventing
    this._oldSelection = [];
  
    // Init the collection mutation observer
    this.items._startHandlingItems(true);
  }
  
  /**
   Allows to interact with the masonry items.
   
   @type {SelectableCollection}
   @readonly
   */
  get items() {
    if (!this._items) {
      this._items = new SelectableCollection({
        host: this,
        itemTagName: 'coral-masonry-item',
        // allows masonry to be nested
        itemSelector: ':scope > coral-masonry-item:not([_removing]):not([_placeholder])',
        onItemAdded: this._validateSelection,
        onItemRemoved: this._validateSelection
      });
    }
    
    return this._items;
  }
  
  /**
   Selection mode of Masonry
   
   @type {String}
   @default MasonrySelectionModeEnum.NONE
   @htmlattribute selectionmode
   @htmlattributereflected
   */
  get selectionMode() {
    return this._selectionMode || selectionMode.NONE;
  }
  set selectionMode(value) {
    value = transform.string(value).toLowerCase();
    this._selectionMode = validate.enumeration(selectionMode)(value) && value || selectionMode.NONE;
    this._reflectAttribute('selectionmode', this._selectionMode);
    
    if (this._selectionMode === selectionMode.NONE) {
      this.classList.remove('is-selectable');
      this.removeAttribute('aria-multiselectable');
    }
    else {
      this.classList.add('is-selectable');
      this.setAttribute('aria-multiselectable', this._selectionMode === selectionMode.MULTIPLE);
    }
    
    this._validateSelection();
  }
  
  _onItemSelectedChanged(event) {
    event.stopImmediatePropagation();
    
    this._validateSelection(event.target);
  }
  
  /**
   The layout name for this masonry. Must be one of {@link Coral.Masonry.layouts}.
   See {@link MasonryLayoutsEnum}.
   
   @type {String}
   @default MasonryLayoutsEnum.FIXED_CENTERED
   @htmlattribute layout
   @htmlattributereflected
   */
  get layout() {
    return this._layout || layouts.FIXED_CENTERED;
  }
  set layout(value) {
    value = transform.string(value);
    const layoutEnum = this.constructor._layouts;
    
    if (value === '') {
      // Default is first registered layout which is "fixed-centered"
      value = Object.keys(layoutEnum)[0];
    }
  
    if (value !== this._layout) {
      if (layoutEnum[value]) {
        this._layout = value;
        this._reflectAttribute('layout', this._layout);
        
        this._scheduleLayout('new layout');
      }
      else {
        commons._log('Coral.Masonry: Unknown layout:', value);
      }
    }
  }
  
  /**
   The first selected item or <code>null</code> if no item is selected.
   
   @type {MasonryItem}
   @readonly
   */
  get selectedItem() {
    return this.items._getFirstSelected();
  }
  
  /**
   An array of all selected items.
   
   @type {Array.<MasonryItem>}
   @readonly
   */
  get selectedItems() {
    return this.items._getAllSelected();
  }
  
  // TODO this is layout specific. move to layout?
  /**
   The spacing between the items and the masonry container in pixel. If this property is not set, then it falls
   back to the CSS padding of the masonry and margin of the items.
   
   @type {?Number}
   @default null
   @htmlattribute spacing
   */
  get spacing() {
    return this._spacing || null;
  }
  set spacing(value) {
    value = transform.number(value);
    this._spacing = value !== null ? Math.max(0, value) : null;
  
    this._scheduleLayout('spacing');
  }
  
  /**
   Whether or not it is possible to order items with drag & drop.
   
   @type {Boolean}
   @default false
   @htmlattribute orderable
   */
  get orderable() {
    return this._orderable || false;
  }
  set orderable(value) {
    this._orderable = transform.booleanAttr(value);
  
    const items = this.items.getAll();
  
    for (let i = 0; i < items.length; i++) {
      items[i][this._orderable ? 'setAttribute' : 'removeAttribute']('_orderable', '');
    }
  }
  
  _validateSelection(item) {
    const selectedItems = this.selectedItems;
    
    if (this.selectionMode === selectionMode.NONE) {
      selectedItems.forEach((selectedItem) => {
        // Don't trigger change events
        this._preventTriggeringEvents = true;
        selectedItem.removeAttribute('selected');
      });
    }
    else if (this.selectionMode === selectionMode.SINGLE) {
      // Last selected item wins if multiple selection while not allowed
      item = item || selectedItems[selectedItems.length - 1];
      
      if (item && item.hasAttribute('selected') && selectedItems.length > 1) {
        selectedItems.forEach((selectedItem) => {
          if (selectedItem !== item) {
            // Don't trigger change events
            this._preventTriggeringEvents = true;
            selectedItem.removeAttribute('selected');
          }
        });
        
        // We can trigger change events again
        this._preventTriggeringEvents = false;
      }
    }
    
    this._triggerChangeEvent();
  }
  
  _triggerChangeEvent() {
    const selectedItems = this.selectedItems;
    const oldSelection = this._oldSelection;
    
    if (!this._preventTriggeringEvents && this._arraysAreDifferent(selectedItems, oldSelection)) {
      if (this.selectionMode === selectionMode.MULTIPLE) {
        this.trigger('coral-masonry:change', {
          oldSelection: oldSelection,
          selection: selectedItems
        });
      }
      else {
        this.trigger('coral-masonry:change', {
          oldSelection: oldSelection.length > 1 ? oldSelection : oldSelection[0] || null,
          selection: selectedItems[0] || null
        });
      }
      
      this._oldSelection = selectedItems;
    }
  }
  
  _arraysAreDifferent(selection, oldSelection) {
    let diff = [];
    
    if (oldSelection.length === selection.length) {
      diff = oldSelection.filter((item) => selection.indexOf(item) === -1);
    }
    
    // since we guarantee that they are arrays, we can start by comparing their size
    return oldSelection.length !== selection.length || diff.length !== 0;
  }
  
  _onItemClick(event) {
    if (this.selectionMode !== selectionMode.NONE) {
      event.preventDefault();
      
      const item = event.matchedTarget;
      item[item.hasAttribute('selected') ? 'removeAttribute' : 'setAttribute']('selected', '');
    }
  }
  
  /** @private */
  _setAllSelected(selected) {
    const items = this.items.getAll();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.hasAttribute('selected') !== selected) {
        item[selected ? 'setAttribute' : 'removeAttribute']('selected', '');
      }
    }
  }
  
  /**
   Schedules a layout for the next animation frame. Even if called many times, the layout happens still just once.
   
   @private
   */
  _scheduleLayout() {
    if (!this._forceDebounce && !this._layoutScheduled) {
      window.requestAnimationFrame(() => {
        // Skip layout if a layout was forced in between
        if (this._layoutScheduled) {
          this._doLayout();
          // Cancel potentially scheduled layout if the current layout was enforced by calling doLayout directly
          this._layoutScheduled = false;
        }
      });
      
      this._layoutScheduled = true;
    }
  }
  
  /** @private */
  _scheduleDebouncedLayout(force) {
    // Do not force debounce if the masonry isn't layouted yet. Safari sometimes triggers resize events while loading.
    if (force && this._layouted) {
      this._forceDebounce = true;
    }
    window.clearTimeout(this._debounceId);
    
    this._debounceId = window.setTimeout(() => {
      this._forceDebounce = false;
      this._scheduleLayout('window resize');
    }, 500);
  }
  
  /**
   Callback which has to be called when the dimensions have changed or the masonry turned visible.
   
   @private
   */
  _onResize() {
    if (!this._layouted) {
      // The masonry was first invisible, render it now immediately
      this._doLayout('became visible');
    }
    else {
      this._scheduleDebouncedLayout(false);
    }
  }
  
  /** @private */
  _onWindowResize() {
    this._scheduleDebouncedLayout(true);
  }
  
  /**
   Performs a layout. Should only be called by {@link #_scheduleLayout} if possible.
   
   @private
   */
  _doLayout() {
    const visible = !!this.offsetParent;
    const LayoutClass = this.constructor._layouts[this.layout];
    if (this._forceDebounce || !LayoutClass || !visible) {
      return;
    }
    
    if (!this._layoutInstance) {
      this._layoutInstance = new LayoutClass(this);
    }
    // Check if the layout has changed
    else if (this._layoutInstance.name !== this.layout) {
      this._layoutInstance.destroy();
      this._layoutInstance = new LayoutClass(this);
    }
    
    // Animate insertion. In the attachedCallback of the item, the is-beforeInserting class was already added. This
    // class is now removed again which allows to transition between the is-beforeInserting and is-inserting class.
    // By separating the code and batching the changes, the overhead is reduced significantly.
    let i;
    const newItems = this._newItems;
    for (i = 0; i < newItems.length; i++) {
      newItems[i]._insert();
    }
    
    // Position the items
    this._layoutInstance.layout();
    this._layouted = true;
    
    // Mark newly added items as managed. Before this class is added, the items are invisible. The reason why this is
    // done here after positioning the items is that it seems to be the only way to ensure that the items are never
    // shown at the wrong position. There used to be two cases when this happened:
    // - When the masonry is first invisible and later shown because the resize event is triggered too late.
    // - In some browsers (e.g. Safari) always when items are added dynamically
    for (i = 0; i < newItems.length; i++) {
      newItems[i].classList.add('is-managed');
    }
    // clear
    newItems.length = 0;
    
    // Update loaded class. Cannot be done in _updateLoaded because it has to happen after the positioning.
    this.classList.toggle('is-loaded', this._loaded);
    
    // Ensure that the tabbable item is set & still valid
    const tabbableItem = this._tabbableItem;
    if (!tabbableItem || isRemovingOrRemoved(tabbableItem)) {
      this._setTabbableItem(this.items.first());
    }
    
    // Focus the next item if the previously focused item has been removed
    const focusedItem = this._focusedItem;
    if (focusedItem) {
      if (isRemovingOrRemoved(focusedItem) && this._focusedItemNext) {
        this._focusedItemNext.focus();
      }
      else if (focusedItem !== document.activeElement) {
        this._focusedItem = null;
        this._focusedItemNext = null;
      }
    }
    
    // Prevent endless observation loop (skip mutations which have been caused by the layout)
    this._observer.takeRecords();
  }
  
  /** @ignore */
  _updateLoaded() {
    // Wait until complete because fonts might be loaded after interactive
    if (!this._loaded && document.readyState === 'complete') {
      let loaded = true;
      const images = this.querySelectorAll('img');
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // _loadError is set in a listener at the top of this file
        if (image.src && !image.complete && !image._loadError) {
          loaded = false;
          break;
        }
      }
      this._loaded = loaded;
    }
    // A loaded image might have made an item bigger
    this._scheduleLayout();
  }
  
  /** @private */
  _onItemConnected(event) {
    event.stopImmediatePropagation();
  
    // We don't care about transitions if the masonry is not in the body
    if (!document.body.contains(this)) {
      return;
    }
    
    const item = event.target;
  
    // check if just moving
    if (!item.hasAttribute('_removing') && this !== item._masonry && !item.hasAttribute('_placeholder')) {
      item._masonry = this;

      // Insert animation start style. This is separated from _insert because otherwise we would have to enforce a
      // reflow between changing the classes for every item (which is slow).
      item.classList.add('is-beforeInserting');
  
      // Do it in the next frame so that the inserting animation is visible
      window.requestAnimationFrame(() => {
        this._onItemAdded(item);
      });
    }
  }
  
  /** @private */
  _onItemDisconnected(item) {
    // We don't care about transitions if the masonry is not in the body
    if (!document.body.contains(this)) {
      return;
    }
    
    // Ignore the item being dropped after ordering
    if (item._dropping) {
      return;
    }
    
    if (!item.hasAttribute('_removing')) {
      // Attach again for remove transition
      item.setAttribute('_removing', '');
      this.appendChild(item);
      commons.transitionEnd(item, () => {
        item.remove();
      });
    }
    // remove transition completed
    else {
      item.removeAttribute('_removing');
      item._masonry = null;
      
      this._onItemRemoved(item);
    }
  }
  
  /** @private */
  _onItemAdded(item) {
    item._updateDragAction(this.orderable);
    this._newItems.push(item);
    
    // Hack to prevent flickering in some browsers which don't support custom elements natively (e.g. Safari)
    if (this._attaching && item.nextElementSibling === null) {
      this._doLayout('last item attached');
    }
  }
  
  /** @private */
  _onItemRemoved(item) {
    item._updateDragAction(false);
    item.classList.remove('is-managed');
  }
  
  /** @private */
  _onItemFocus(e) {
    const item = e.target;
    if (item === e.matchedTarget) {
      this._setTabbableItem(item);
      
      // Remember the focused item and a sibling for the case when the currently focused item is removed and another
      // item has to be selected in _doLayout
      this._focusedItem = item;
      this._focusedItemNext = [item.nextElementSibling, item.previousElementSibling].filter(itemFilter)[0];
    }
  }
  
  /** @private */
  _setTabbableItem(item) {
    if (this._tabbableItem) {
      this._tabbableItem._setTabbable(false);
    }
    if (item) {
      item._setTabbable(true);
    }
    this._tabbableItem = item;
  }
  
  /**
   @return {Boolean} true if the new position isn't further away from the center of the placeholder than the
   previous position.
   
   @private
   */
  _isApproachingPlaceholder(pos, prevPos, placeholder) {
    const placeholderPos = relativePosition(this, placeholder);
    const placeholderWidth = placeholder.offsetWidth;
    const placeholderHeight = placeholder.offsetHeight;
    const placeholderX = placeholderPos.left + placeholderWidth / 2;
    const placeholderY = placeholderPos.top + placeholderHeight / 2;
    
    // A weighted distance is used to improve the user experience with rather long/high cards
    return weightedDistance(placeholderX, placeholderY, pos.left, pos.top, placeholderWidth, placeholderHeight) <=
      weightedDistance(placeholderX, placeholderY, prevPos.left, prevPos.top, placeholderWidth, placeholderHeight);
  }
  
  /** @private */
  _onItemDragStart(e) {
    const item = e.target;
    if (item === e.matchedTarget) {
      this._layoutInstance.detach(item);
      item._oldBefore = getPreviousItem(item);
      
      const placeholder = item._dropPlaceholder = new MasonryItem();
      placeholder.setAttribute('_placeholder', '');
      
      // Add a content div with the right dimension instead of setting the dimension on the item directly. This is
      // necessary because some layouts modify the dimensions as well.
      const contentDiv = document.createElement('div');
      contentDiv.style.width = `${item.clientWidth}px`;
      contentDiv.style.height = `${item.clientHeight}px`;
      placeholder.appendChild(contentDiv);
      
      // Insert placeholder before dragged item
      placeholder.classList.add('_coral-Masonry-item--placeholder');
      
      this.insertBefore(placeholder, item);
    }
  }
  
  /** @private */
  _onItemDragMove(e) {
    const item = e.target;
    const placeholder = item._dropPlaceholder;
    if (item === e.matchedTarget && placeholder) {
      const prevPos = item._prevDragPos;
      const pos = relativePosition(this, item);
      // If the current move is approaching the previous placeholder target, then it must not move the placeholder
      // again. Otherwise it can happen with multi-column items that the items jump around hectically while dragging
      // an item.
      if (!prevPos || !this._isApproachingPlaceholder(pos, prevPos, placeholder)) {
        // Find item below cursor
        const itemBelow = this._layoutInstance.itemAt(pos.left, pos.top);
        
        if (itemBelow && itemBelow !== placeholder) {
          // If the item below (the dragged item) is preceding the placeholder, then it has to insert the placeholder
          // before the item below (the dragged item)
          if (placeholder.compareDocumentPosition(itemBelow) & document.DOCUMENT_POSITION_PRECEDING) {
            itemBelow.parentNode.insertBefore(placeholder, itemBelow);
          }
          else {
            itemBelow.parentNode.insertBefore(placeholder, itemBelow.nextSibling);
          }
        }
      }
      item._prevDragPos = pos;
    }
  }
  
  /** @private */
  _onItemDragEnd(e) {
    const item = e.target;
    const placeholder = item._dropPlaceholder;
    if (item === e.matchedTarget && placeholder) {
      item._dropping = true;
      // Replace the drop placeholder with this item
      this.replaceChild(item, placeholder);
      item._dropping = false;
      
      // Trigger order event
      item.trigger('coral-masonry:order', {
        item: item,
        oldBefore: item._oldBefore,
        before: getPreviousItem(item)
      }, true, false);

      // // Drop transition
      this._layoutInstance.reattach(item);
      item.classList.add('is-dropping');
      commons.transitionEnd(item, () => {
        item.classList.remove('is-dropping');
      });
    }
    item._oldBefore = null;
    item._dropPlaceholder = null;
    item._prevDragPos = null;
  }
  
  /**
   Registry for masonry layouts.
   
   @type {Object.<string,Layout>}
   @private
   @readonly
   */
  static get _layouts() {
    if (!this.__layouts) {
      this.__layouts = {};
    }
    
    return this.__layouts;
  }
  
  /**
   Registers a layout with the given name.
   The name can then be set at {@link Coral.Masonry.layout} to render a masonry with the this registered layout.
   
   @param {String} name of the layout
   @param {Layout} Layout class which extends {@link Coral.Masonry.Layout}
   */
  static registerLayout(name, Layout) {
    Layout.defineName(name);
    this._layouts[name] = Layout;
  }
  
  /**
   Returns {@link Masonry} layouts.
   
   @return {MasonryLayoutsEnum}
   */
  static get layouts() { return layouts; }
  
  /**
   Returns {@link Masonry} selection mode options.
   
   @return {MasonrySelectionModeEnum}
   */
  static get selectionMode() { return selectionMode; }
  
  static get _attributePropertyMap() {
    return commons.extend(super._attributePropertyMap, {
      selectionmode: 'selectionMode'
    });
  }
  
  /** @ignore */
  static get observedAttributes() {
    return super.observedAttributes.concat([
      'selectionmode',
      'layout',
      'spacing',
      'orderable'
    ]);
  }
  
  /** @ignore */
  connectedCallback() {
    super.connectedCallback();
    
    this.classList.add(CLASSNAME);
    
    // a11y
    this.setAttribute('role', 'group');
    
    // Default reflected attributes
    if (!this._layout) { this.layout = layouts.FIXED_CENTERED; }
    if (!this._selectionMode) { this.selectionMode = selectionMode.NONE; }
  
    // Don't trigger events once connected
    this._preventTriggeringEvents = true;
    this._validateSelection();
    this._preventTriggeringEvents = false;
  
    this._oldSelection = this.selectedItems;
    
    // Handles the resizing of the masonry
    commons.addResizeListener(this, this._onResize.bind(this));

    // This indicates that the initial items are being attached
    this._attaching = true;
    
    window.requestAnimationFrame(() => {
      this._attaching = false;
      // Update loaded after all items have been attached
      this._updateLoaded();
    });
  }
  
  /**
   Triggered when a {@link Masonry} item is reordered.
   
   @typedef {CustomEvent} coral-masonry:order
   
   @property {MasonryItem} detail.item
   The reordered item
   @property {?MasonryItem} detail.oldBefore
   The previous item before the reordering.
   @property {?MasonryItem} detail.before
   The previous item after the reordering.
   */
  
  /**
   Triggered when {@link Masonry} selected item has changed.
   
   @typedef {CustomEvent} coral-masonry:change
   
   @property {MasonryItem} detail.oldSelection
   The prior selected item(s).
   @property {MasonryItem} detail.selection
   The newly selected item(s).
   */
}

export default Masonry;