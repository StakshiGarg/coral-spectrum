describe('CUI.Popover', function() {
  var popoverBorderThickness = 8;
  var tailDimensions = {
    topBottom: {
      width: 5,
      height: 5
    },
    leftRight: {
      width: 5,
      height: 5
    }
  };

  // To properly test popover positioning we need to simulate styles that will be commonly found in
  // a real environment. While we could use the CoralUI stylesheet directly, the test cases would then need
  // to be updated when trivial changes are made to the stylesheet (e.g., tail size or border width). Instead, we'll
  // use these styles (derived from the CoralUI stylesheet) to sufficiently simulate.
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = '' +
      '.coral-Popover {' +
      '  position: absolute;' +
      '  display: none;' +
      '  z-index: 1010;' +
      '  top: -9999px;' +
      '  left: -9999px;' +
      '  background-color: #f5f5f5;' +
      '  -webkit-background-clip: padding-box;' +
      '  -moz-background-clip: padding-box;' +
      '  background-clip: padding-box;' +
      '  border: ' + popoverBorderThickness + 'px solid rgba(90, 90, 90, 0.8);' +
      '  margin: 10px;' +
      '}';

  var removeElements = function() {
    $('.target,.coral-Popover').remove();
  };

  before(function() {
    $('head').append(style);
  });

  after(function() {
    $(style).remove();
    removeElements();
  });

  beforeEach(function(done) {
    // Necessary for positional tests to function consistently because the position of a popover changes
    // depending on where the target (e.g., a button the popover is point to) is in relation to the view pane.
    // This must run before each test because after each test mocha scrolls to the bottom of the document.
    window.scrollTo(0, 0);
    // Safari's scrollTo() works asynchronously so we have to wait until the next frame to proceed.
    setTimeout(done, 0);
  });

  describe('definition', function() {
    // 'definition' block is a temporary workaround for kmiyashiro/grunt-mocha/issues/22
    it('should be defined in CUI namespace', function() {
      expect(CUI).to.have.property('Popover');
    });

    it('should be defined on jQuery object', function() {
      var div = $('<div/>');
      expect(div).to.have.property('popover');
    });
  });

  describe('popover from plugin', function() {
    it('should have correct CSS classnames', function() {
      var el = $('<div/>').popover({
        pointAt: [100, 100]
      });
      expect(el).to.have.class('coral-Popover');
    });
  });

  describe('content option', function() {

    it('can set content through constructor', function() {

      var content = '<span>My content</span>';

      // creates a new element with the given content
      var el = new CUI.Popover({
          element: $('<div/>'),
          pointAt: [100, 100],
          content: content
      });

      // not sure if I should access $element directly
      expect(el.$element.html()).to.have.string(content);
    });

    it('can set content through jquery plugin constructor', function() {
      var content = '<span>My content</span>';

      var el = $('<div/>').popover({
        pointAt: [100, 100],
        content: content
      });

      // el.html() and content do not match exactly because the popover adds the tail as a child.
      expect(el.html()).to.have.string(content);
    });

    it('can set content through setter', function() {
      var content = '<span>My content</span>';

      var el = $('<div/>').popover({
        pointAt: [100, 100]
      });

      el.popover('set', 'content', content);

      // el.html() and content do not match exactly because the popover adds the tail as a child.
      expect(el.html()).to.have.string(content);
    });
  });

  describe('visibility', function() {
    var popover;

    beforeEach(function() {
      popover = new CUI.Popover({
        element: $('<div/>'),
        pointAt: [0, 0]
      });
    });

    it('shows popover when show() is called', function() {
      popover.hide();
      popover.show();
      expect(popover.$element.css('display')).to.equal('block');
    });

    it('hides popover when hide() is called', function() {
      popover.show();
      popover.hide();
      expect(popover.$element.css('display')).to.equal('none');
    });

    it('shows when show() is called manually as a result of a click', function() {
      var $button = $('<button id="myButton" class="coral-Button">Toggle Popover</button>')
        .appendTo('body')
        .on('click', function() {
          popover.show();
        })
        .trigger('click');

      expect(popover.$element.css('display')).to.equal('block');
      $button.remove();
    });
  });

  describe('basic positioning', function() {
    var popoverWidth = 10,
        popoverHeight = 10,
        popover,
        popoverEl,
        tailEl;

    var testAllSides = function(targetRect) {
      it('positions popover below', function() {
        popover.set('pointFrom', 'bottom');

        expect(popoverEl.offset()).to.eql({
          top: targetRect.top + targetRect.height + tailDimensions.topBottom.height,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2 - popoverBorderThickness
        });

        expect(popover._$tail.offset()).to.eql({
          top: targetRect.top + targetRect.height,
          left: targetRect.left + targetRect.width / 2 - tailDimensions.topBottom.width / 2
        });
      });

      it('positions popover above', function() {
        popover.set('pointFrom', 'top');

        expect(popoverEl.offset()).to.eql({
          top: targetRect.top - tailDimensions.topBottom.height - popoverHeight - popoverBorderThickness * 2,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2 - popoverBorderThickness
        });

        expect(popover._$tail.offset()).to.eql({
          top: targetRect.top - tailDimensions.topBottom.height,
          left: targetRect.left + targetRect.width / 2 - tailDimensions.topBottom.width / 2
        });
      });

      it('positions popover to the left', function() {
        popover.set('pointFrom', 'left');

        expect(popoverEl.offset()).to.eql({
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2 - popoverBorderThickness,
          left: targetRect.left - tailDimensions.leftRight.width - popoverWidth - popoverBorderThickness * 2
        });

        expect(popover._$tail.offset()).to.eql({
          top: targetRect.top + targetRect.height / 2 - tailDimensions.leftRight.height / 2,
          left: targetRect.left - tailDimensions.leftRight.width
        });
      });

      it('positions popover to the right', function() {
        popover.set('pointFrom', 'right');

        expect(popoverEl.offset()).to.eql({
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2 - popoverBorderThickness,
          left: targetRect.left + targetRect.width + tailDimensions.leftRight.width
        });

        expect(popover._$tail.offset()).to.eql({
          top: targetRect.top + targetRect.height / 2 - tailDimensions.leftRight.height / 2,
          left: targetRect.left + targetRect.width
        });
      });
    };

    before(function() {
      popoverEl = $('<div/>');
      popoverEl.css({
        width: popoverWidth + 'px',
        height: popoverHeight + 'px'
      });
      $('body').append(popoverEl);

      popover = new CUI.Popover({
        element: popoverEl,
        pointAt: [0, 0]
      });

      popover.show();

      tailEl = popover._$tail;
    });

    after(function() {
      removeElements();
    });

    describe.skip('around target element', function() {
      var targetTop = 50,
          targetLeft = 50,
          targetWidth = 20,
          targetHeight = 20;

      before(function() {
        var targetEl = $('<div class="target"/>');
        targetEl.css({
          position: 'absolute',
          top: targetTop + 'px',
          left: targetLeft + 'px',
          width: targetWidth + 'px',
          height: targetHeight + 'px'
        });

        $('body').append(targetEl);
        popover.set('pointAt', targetEl);
      });

      testAllSides({
        top: targetTop,
        left: targetLeft,
        width: targetWidth,
        height: targetHeight
      });
    });

    describe.skip('around coordinate', function() {
      var targetX = 100,
          targetY = 100;

      before(function() {
        popover.set('pointAt', [targetX, targetY]);
      });

      testAllSides({
        top: targetY,
        left: targetX,
        width: 0,
        height: 0
      });
    });
  });

  describe('edge flipping', function() {
    var popoverWidth = 10,
        popoverHeight = 10,
        popover,
        popoverEl,
        tailEl;

    before(function() {
      popoverEl = $('<div/>');
      popoverEl.css({
        width: popoverWidth + 'px',
        height: popoverHeight + 'px'
      });
      $('body').append(popoverEl);

      popover = new CUI.Popover({
        element: popoverEl,
        pointAt: [0, 0]
      });

      popover.show();

      tailEl = popover._$tail;
    });

    after(function() {
      removeElements();
    });

    it('flips popover horizontally when conflicting with the viewport left edge', function() {
      popover.set({
        pointAt: [1, 50],
        pointFrom: 'left'
      });

      // Because a gap is provided for the tail to be placed between, the popover would normally be positioned
      // outside the viewport if not flipped.
      // 10 = margin of the padding
      expect(popoverEl.offset().left).to.equal(10);
    });

    it('flips popover horizontally when conflicting with the viewport right edge', function() {
      var viewportWidth = $(window).width();
      popover.set({
        pointAt: [viewportWidth - 1, 50],
        pointFrom: 'right'
      });

      // Because a gap is provided for the tail to be placed between, the popover would normally be positioned
      // outside the viewport if not flipped.
      expect(popoverEl.offset().left).to.be.below(viewportWidth);
    });

    it('flips popover vertically when conflicting with the viewport top edge', function() {
      popover.set({
        pointAt: [50, 1],
        pointFrom: 'bottom'
      });

      // Because a gap is provided for the tail to be placed between, the popover would normally be positioned
      // outside the viewport if not flipped.
      expect(popoverEl.offset().top).to.be.above(0);
    });

    it('flips popover vertically when conflicting with the viewport bottom edge', function() {
      var viewportHeight = $(window).height();
      popover.set({
        pointAt: [50, viewportHeight - 1],
        pointFrom: 'bottom'
      });

      // Because a gap is provided for the tail to be placed between, the popover would normally be positioned
      // outside the viewport if not flipped.
      expect(popoverEl.offset().top).to.be.below(viewportHeight);
    });

    it('does not position the popover to be cropped by the top of the document (CUI-794)' , function() {
      // The popover will generally flip to whichever side of the target will show a larger portion of
      // the popover. However, we never want to position the popover in such a way that it's cropped by the
      // top or left of the document since the user, in this case, would not even be able to scroll to see
      // the rest of the popover.
      var viewportHeight = $(window).height();

      popoverEl.css({
        height: viewportHeight
      });

      popover.set({
        pointAt: [50, viewportHeight * 0.6],
        pointFrom: 'bottom'
      });

      expect(popoverEl.offset().top).to.be.above(viewportHeight / 2);

      popover.set({
        pointFrom: 'top'
      });

      expect(popoverEl.offset().top).to.be.above(viewportHeight / 2);
    });

    it('does not position the popover to be cropped by the left of the document (CUI-794)' , function() {
      // The popover will generally flip to whichever side of the target will show a larger portion of
      // the popover. However, we never want to position the popover in such a way that it's cropped by the
      // top or left of the document since the user, in this case, would not even be able to scroll to see
      // the rest of the popover.
      var viewportWidth = $(window).width();

      popoverEl.css({
        width: viewportWidth
      });

      popover.set({
        pointAt: [viewportWidth * 0.6, 50],
        pointFrom: 'left'
      });

      expect(popoverEl.offset().left).to.be.above(viewportWidth / 2);

      popover.set({
        pointFrom: 'right'
      });

      expect(popoverEl.offset().left).to.be.above(viewportWidth / 2);
    });
  });

  describe('alignFrom', function() {
    var popoverEl,
        popover;
    before(function() {
      popoverEl = $('<div/>');
      popoverEl.css({
        width: '10px',
        height: '10px'
      });
      $('body').append(popoverEl);

      popover = new CUI.Popover({
        element: popoverEl,
        pointAt: [100, 100]
      });

      popover.show();
    });

    after(function() {
      removeElements();
    });

    it('supports left and right alignment', function() {
      popover.set('alignFrom', 'left');
      var alignLeftOffset = popoverEl.offset();
      expect(popoverEl.css('left')).to.have.string('px');
      // Doesn't work in Firefox since it reports the calculated value even though it's set to auto.
      //expect(popoverEl.css('right')).to.equal('auto');
      popover.set('alignFrom', 'right');
      var alignRightOffset = popoverEl.offset();
      // Doesn't work in Firefox since it reports the calculated value even though it's set to auto.
      // expect(popoverEl.css('left')).to.equal('auto');
      expect(popoverEl.css('right')).to.have.string('px');
      expect(alignLeftOffset).to.eql(alignRightOffset);
    });
  });

  describe('accessibility', function() {
    var popover,
        $trigger;

    before(function(done) {
      $trigger = $('<button id="myButton">Toggle Popover</button>')
      .appendTo('body')
      .on('click', function(event) {
        if (!$(event.target).is(document.activeElement)) {
          $(event.target).focus();
        }
        popover = $('#myPopover').data('popover');
        if (!popover) {
          popover = new CUI.Popover({
            element: $('<div id="myPopover">').appendTo('body'),
            pointAt:'#myButton',
            content: '<div class="u-coral-padding">Lorem ipsum hipstorum.</div>'
          });
        }
        popover.toggleVisibility();
        done();
      }).click();
    });

    after(function() {
      removeElements();
    });

    describe('WAI-ARIA: ', function() {

      it('attribute role="dialog"', function() {
        popover.show();
        expect(popover.$element.attr('role')).to.equal('dialog');
      });

      it('when visible, attribute aria-hidden="false"', function() {
        popover.show();
        expect(popover.$element.attr('aria-hidden')).to.equal('false');
      });

      it('when hidden, attribute aria-hidden="true"', function() {
        popover.hide();
        expect(popover.$element.attr('aria-hidden')).to.equal('true');
      });

      it('attribute aria-labelledby is the id of the first content region', function() {
        popover.show();
        var $contentElements = popover._getContentElement(popover.$element);
        expect(popover.$element.attr('aria-labelledby')).to.equal($contentElements.get(0).id);
      });

    });

    describe('focus management:', function() {

      describe('with no focusable children, ', function() {
        it('the $element receives focus.', function() {
          popover.hide();
          popover.set('content', '<div class="u-coral-padding">Lorem ipsum hipstorum.</div>');
          popover.show();
          expect(popover.$element.is(document.activeElement)).to.be.true;
        });
      });

      describe('with focusable children,', function() {
        it('the first tabbable element receives focus.', function() {
          popover.hide();
          popover.set('content', '<div class="u-coral-padding"><button id="firstButton">Focusable Button #1</button> Lorem ipsum hipstorum. <button id="secondButton">Focusable Button #2</button></div>');
          $trigger.click();
          expect($('#firstButton').is(document.activeElement)).to.be.true;
        });
      });

      describe('escape key', function() {
        var e = $.Event('keydown', {keyCode: 27, which: 27});
        it.skip('hides popover and restores focus to trigger element', function() {
          popover.hide();
          $trigger.click();
          $(document.activeElement).trigger(e);
          expect($trigger.is(document.activeElement)).to.be.true;
        });

        it.skip('hides the popover when neither trigger nor popover has focus', function() {
          popover.hide();
          $trigger.click();
          $(document.activeElement).blur();
          $(document.activeElement).trigger(e);
          expect($('body').is(document.activeElement)).to.be.true;
        });
      });

      describe('F6 key', function() {
        it.skip('restores focus to document.', function() {
          var eF6 = $.Event('keydown', {keyCode: 117, which: 117}),
            eTab = $.Event('keydown', {keyCode: 9, which: 9});
          popover.hide();
          popover.set('content', '<div class="u-coral-padding"><button id="firstButton">Focusable Button #1</button> Lorem ipsum hipstorum. <button id="secondButton">Focusable Button #2</button></div>');
          $trigger.click();
          $(document.activeElement).trigger(eTab);
          $(document.activeElement).attr('tabindex','1').trigger(eF6);
          expect($trigger.is(document.activeElement)).to.be.true;
          expect(popover.$element.attr('aria-hidden')).to.equal('true');
          expect($(popover._lastFocused).attr('tabindex')).to.equal('-1');
          expect($(popover._lastFocused).data('cached-tabindex')).to.equal('1');
        });

        // TODO: this test depends on the previous one
        it.skip('restores focus to last focused element within the popover dialog.', function() {
          var eF6 = $.Event('keydown', {keyCode: 117, which: 117}),
            lastFocused = popover._lastFocused;
          $(document.activeElement).trigger(eF6);
          expect(popover.$element.attr('aria-hidden')).to.equal('false');
          expect($(document.activeElement).is(lastFocused)).to.be.true;
          expect($(document.activeElement).attr('tabindex')).to.equal('1');
        });
      });
    });
  });
});
