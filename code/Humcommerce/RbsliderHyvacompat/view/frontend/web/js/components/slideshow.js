// Based on Zepto.js touch.js
// Zepto.js may be freely distributed under the MIT license.
// Originally there is only in JQuery which i have converted.

(function () {
  const touch = {};
  let touchTimeout, tapTimeout, swipeTimeout, longTapTimeout;
  const longTapDelay = 750;
  let gesture;

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2)
      ? x1 - x2 > 0
        ? "Left"
        : "Right"
      : y1 - y2 > 0
      ? "Up"
      : "Down";
  }

  function longTap() {
    longTapTimeout = null;
    if (touch.last && touch.el) {
      touch.el.dispatchEvent(new CustomEvent("longTap", { bubbles: true }));
      Object.keys(touch).forEach((key) => delete touch[key]);
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout);
    longTapTimeout = null;
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout);
    if (tapTimeout) clearTimeout(tapTimeout);
    if (swipeTimeout) clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
    Object.keys(touch).forEach((key) => delete touch[key]);
  }

  function isPrimaryTouch(event) {
    return event.pointerType === "touch" && event.isPrimary;
  }

  function getTarget(el) {
    return el.tagName ? el : el.parentNode;
  }

  function attachCustomEvent(eventName) {
    Element.prototype[eventName] = function (callback) {
      this.addEventListener(eventName, callback);
      return this;
    };
  }

  // Initialize when DOM is ready
  function init() {
    let now,
      delta,
      deltaX = 0,
      deltaY = 0,
      firstTouch;

    // MSGesture for IE10
    if ("MSGesture" in window) {
      gesture = new MSGesture();
      gesture.target = document.body;
    }

    // Swipe gesture end
    document.addEventListener("MSGestureEnd", function (e) {
      const velocityX = e.originalEvent?.velocityX || 0;
      const velocityY = e.originalEvent?.velocityY || 0;

      const swipeDirectionFromVelocity =
        velocityX > 1
          ? "Right"
          : velocityX < -1
          ? "Left"
          : velocityY > 1
          ? "Down"
          : velocityY < -1
          ? "Up"
          : null;

      if (swipeDirectionFromVelocity && touch.el) {
        touch.el.dispatchEvent(new CustomEvent("swipe", { bubbles: true }));
        touch.el.dispatchEvent(
          new CustomEvent("swipe" + swipeDirectionFromVelocity, {
            bubbles: true,
          })
        );
      }
    });

    document.addEventListener("gestureend", function (e) {
      const velocityX = e.originalEvent?.velocityX || 0;
      const velocityY = e.originalEvent?.velocityY || 0;

      const swipeDirectionFromVelocity =
        velocityX > 1
          ? "Right"
          : velocityX < -1
          ? "Left"
          : velocityY > 1
          ? "Down"
          : velocityY < -1
          ? "Up"
          : null;

      if (swipeDirectionFromVelocity && touch.el) {
        touch.el.dispatchEvent(new CustomEvent("swipe", { bubbles: true }));
        touch.el.dispatchEvent(
          new CustomEvent("swipe" + swipeDirectionFromVelocity, {
            bubbles: true,
          })
        );
      }
    });

    // Touch start
    document.addEventListener("touchstart", function (e) {
      firstTouch = e.touches[0];
      now = Date.now();
      delta = now - (touch.last || now);
      touch.el = getTarget(firstTouch.target);

      if (touchTimeout) clearTimeout(touchTimeout);

      touch.x1 = firstTouch.pageX;
      touch.y1 = firstTouch.pageY;

      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

      touch.last = now;
      longTapTimeout = setTimeout(longTap, longTapDelay);
    });

    document.addEventListener("MSPointerDown", function (e) {
      if (!isPrimaryTouch(e)) return;

      firstTouch = e;
      now = Date.now();
      delta = now - (touch.last || now);
      touch.el = getTarget(firstTouch.target);

      if (touchTimeout) clearTimeout(touchTimeout);

      touch.x1 = firstTouch.pageX;
      touch.y1 = firstTouch.pageY;

      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

      touch.last = now;
      longTapTimeout = setTimeout(longTap, longTapDelay);

      if (gesture) gesture.addPointer(e.pointerId);
    });

    document.addEventListener("pointerdown", function (e) {
      if (!isPrimaryTouch(e)) return;

      firstTouch = e;
      now = Date.now();
      delta = now - (touch.last || now);
      touch.el = getTarget(firstTouch.target);

      if (touchTimeout) clearTimeout(touchTimeout);

      touch.x1 = firstTouch.pageX;
      touch.y1 = firstTouch.pageY;

      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

      touch.last = now;
      longTapTimeout = setTimeout(longTap, longTapDelay);

      if (gesture) gesture.addPointer(e.pointerId);
    });

    // Touch move
    document.addEventListener("touchmove", function (e) {
      firstTouch = e.touches[0];
      cancelLongTap();
      touch.x2 = firstTouch.pageX;
      touch.y2 = firstTouch.pageY;

      deltaX += Math.abs(touch.x1 - touch.x2);
      deltaY += Math.abs(touch.y1 - touch.y2);
    });

    document.addEventListener("MSPointerMove", function (e) {
      if (!isPrimaryTouch(e)) return;

      cancelLongTap();
      touch.x2 = e.pageX;
      touch.y2 = e.pageY;

      deltaX += Math.abs(touch.x1 - touch.x2);
      deltaY += Math.abs(touch.y1 - touch.y2);
    });

    document.addEventListener("pointermove", function (e) {
      if (!isPrimaryTouch(e)) return;

      cancelLongTap();
      touch.x2 = e.pageX;
      touch.y2 = e.pageY;

      deltaX += Math.abs(touch.x1 - touch.x2);
      deltaY += Math.abs(touch.y1 - touch.y2);
    });

    // Touch end
    document.addEventListener("touchend", function (e) {
      cancelLongTap();

      // Swipe detection
      if (
        (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)
      ) {
        swipeTimeout = setTimeout(function () {
          if (touch.el) {
            touch.el.dispatchEvent(new CustomEvent("swipe", { bubbles: true }));
            touch.el.dispatchEvent(
              new CustomEvent(
                "swipe" +
                  swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2),
                { bubbles: true }
              )
            );
          }
          Object.keys(touch).forEach((key) => delete touch[key]);
        }, 0);

        // Tap detection
      } else if ("last" in touch) {
        if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
          tapTimeout = setTimeout(function () {
            if (touch.el) {
              const tapEvent = new CustomEvent("tap", { bubbles: true });
              tapEvent.cancelTouch = cancelAll;
              touch.el.dispatchEvent(tapEvent);

              if (touch.isDoubleTap) {
                touch.el.dispatchEvent(
                  new CustomEvent("doubleTap", { bubbles: true })
                );
                Object.keys(touch).forEach((key) => delete touch[key]);
              } else {
                touchTimeout = setTimeout(function () {
                  touchTimeout = null;
                  if (touch.el) {
                    touch.el.dispatchEvent(
                      new CustomEvent("singleTap", { bubbles: true })
                    );
                  }
                  Object.keys(touch).forEach((key) => delete touch[key]);
                }, 250);
              }
            }
          }, 0);
        } else {
          Object.keys(touch).forEach((key) => delete touch[key]);
        }
        deltaX = deltaY = 0;
      }
    });

    document.addEventListener("MSPointerUp", function (e) {
      if (!isPrimaryTouch(e)) return;

      cancelLongTap();

      if (
        (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)
      ) {
        swipeTimeout = setTimeout(function () {
          if (touch.el) {
            touch.el.dispatchEvent(new CustomEvent("swipe", { bubbles: true }));
            touch.el.dispatchEvent(
              new CustomEvent(
                "swipe" +
                  swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2),
                { bubbles: true }
              )
            );
          }
          Object.keys(touch).forEach((key) => delete touch[key]);
        }, 0);
      } else if ("last" in touch) {
        if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
          tapTimeout = setTimeout(function () {
            if (touch.el) {
              const tapEvent = new CustomEvent("tap", { bubbles: true });
              tapEvent.cancelTouch = cancelAll;
              touch.el.dispatchEvent(tapEvent);

              if (touch.isDoubleTap) {
                touch.el.dispatchEvent(
                  new CustomEvent("doubleTap", { bubbles: true })
                );
                Object.keys(touch).forEach((key) => delete touch[key]);
              } else {
                touchTimeout = setTimeout(function () {
                  touchTimeout = null;
                  if (touch.el) {
                    touch.el.dispatchEvent(
                      new CustomEvent("singleTap", { bubbles: true })
                    );
                  }
                  Object.keys(touch).forEach((key) => delete touch[key]);
                }, 250);
              }
            }
          }, 0);
        } else {
          Object.keys(touch).forEach((key) => delete touch[key]);
        }
        deltaX = deltaY = 0;
      }
    });

    document.addEventListener("pointerup", function (e) {
      if (!isPrimaryTouch(e)) return;

      cancelLongTap();

      if (
        (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)
      ) {
        swipeTimeout = setTimeout(function () {
          if (touch.el) {
            touch.el.dispatchEvent(new CustomEvent("swipe", { bubbles: true }));
            touch.el.dispatchEvent(
              new CustomEvent(
                "swipe" +
                  swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2),
                { bubbles: true }
              )
            );
          }
          Object.keys(touch).forEach((key) => delete touch[key]);
        }, 0);
      } else if ("last" in touch) {
        if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
          tapTimeout = setTimeout(function () {
            if (touch.el) {
              const tapEvent = new CustomEvent("tap", { bubbles: true });
              tapEvent.cancelTouch = cancelAll;
              touch.el.dispatchEvent(tapEvent);

              if (touch.isDoubleTap) {
                touch.el.dispatchEvent(
                  new CustomEvent("doubleTap", { bubbles: true })
                );
                Object.keys(touch).forEach((key) => delete touch[key]);
              } else {
                touchTimeout = setTimeout(function () {
                  touchTimeout = null;
                  if (touch.el) {
                    touch.el.dispatchEvent(
                      new CustomEvent("singleTap", { bubbles: true })
                    );
                  }
                  Object.keys(touch).forEach((key) => delete touch[key]);
                }, 250);
              }
            }
          }, 0);
        } else {
          Object.keys(touch).forEach((key) => delete touch[key]);
        }
        deltaX = deltaY = 0;
      }
    });

    // Cancel all events
    document.addEventListener("touchcancel", cancelAll);
    document.addEventListener("MSPointerCancel", cancelAll);
    document.addEventListener("pointercancel", cancelAll);

    // Scrolling cancels all ongoing events
    window.addEventListener("scroll", cancelAll);
  }

  // Attach custom event methods to Element prototype
  [
    "swipe",
    "swipeLeft",
    "swipeRight",
    "swipeUp",
    "swipeDown",
    "doubleTap",
    "tap",
    "singleTap",
    "longTap",
  ].forEach((eventName) => {
    attachCustomEvent(eventName);
  });

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

(() => {
  "use strict";

  /**
   * IIFE (Immediately Invoked Function Expression) wrapper
   * Prevents polluting the global namespace and creates a private scope for variable
   * This is a best practice
   */

  /**
   * Main slideshow factory function, window.awRbslider so that we can excess it
   * anywhere in code.
   *
   * window.awRbslider = function(element,config){
   *
   * return {
   * element:element,
   * current:0, //index
   * slides:[],
   * next:function(),
   * previous:function()
   * }
   *
   * }
   *
   *
   * Our original function contains three dependencies
   * We need to replace all three
   * define(
   * ['jquery','uikit!slideshow','moment'],
   * function($,UIkit,moment)
   * )
   *
   * Replaced UIkit dependency with custom implementation for Hyva compatibility
   * CHANGE Original used UIkit.slideshow(), now we create our own slideshow object
   *
   * @param {HTMLElement} element - The root container element of the slideshow
   * @param {Object} config - Configuration options for the slideshow
   * @returns {Object} slideshow instance with methods like init(), show(), next(), etc.
   */
  window.awRbslider = function (element, config) {
    const slideshow = {
      /**
       * Merge default options with provided config
       * WHY: Provides sensible defaults while allowing customization
       * CHANGE: Removed jQuery.extend(), using native Object.assign()
       *
       * Object.assign(parm1,parm2) mergers parm2 into parm1
       */
      options: Object.assign(
        {
          animation: "fade",
          duration: 500,
          height: "auto",
          start: 0, // Index of initial slide to show
          autoplay: false,
          autoplayInterval: 7000,
          pauseOnHover: true,
        },
        config || {} // Merge with provided config
      ),

      /**
       * Slideshow state is made globle
       * WHY: Need to maintain state across method calls
       */
      current: 0, // Current slide index
      interval: null, // Timer ID for autoplay setInterval
      hovering: false, // Whether mouse is over slideshow
      element: element, // Root DOM element
      container: null, // Slides container element
      slides: [], // Array of slide DOM elements
      slidesCount: 0, // Total number of slides
      animating: false, // Whether animation is in progress (prevents double-clicks)

      /**
       * Initialize the slideshow, This is the first function to get executed when banner comes in view
       */
      init() {
        /**
         * changing $(this.element).find('.uk-slideshow'), now vanilla JS
         */
        this.container = this.element.classList.contains("uk-slideshow")
          ? this.element
          : this.element.querySelector(".uk-slideshow");

        if (!this.container) {
          console.error("Slideshow container not found");
          return;
        }

        /**
         * Set initial state
         */
        this.current = this.options.start;
        this.animating = false;

        /**
         * Get all slide elements as an array
         *
         * We need to convert NodeList(from querySelectorAll) to Array to use forEach and other array methods
         *
         * A nodelist has these methods (Array-like):
         * nodeList.length
         * nodeList[i]
         * nodeList.forEach()
         * nodeList.entries()
         * nodeList.keys()
         * nodeList.values()
         *
         * But nodelist does not have these methods (Array methods):
         * nodeList.map()
         * nodeList.filter()
         * nodeList.reduce()
         * nodeList.find()
         * nodeList.some()
         * nodeList.every()
         * nodelist.slice()
         * nodelist.splice()
         * nodelist.concat()
         * nodelist.join()
         * nodelist.pop()
         * nodelist.sort()
         * And many more...
         *
         */
        this.slides = Array.from(
          this.container.querySelectorAll(".aw-rbslider-item")
        );
        this.slidesCount = this.slides.length;

        if (this.slidesCount === 0) {
          console.error("No slides found");
          return;
        }

        /**
         * Set initial visibility and styling for all slides
         * WHY: Only the current slide should be visible initially
         * CHANGE: Was using jQuery .css() and .addClass(), now direct style/classList manipulation
         */
        this.slides.forEach((slide, index) => {
          if (index === this.current) {
            // Active slide: visible and in document flow
            slide.classList.add("uk-active");
            slide.style.display = "block";
            slide.style.opacity = "1";
            slide.style.position = "relative"; // In document flow
          } else {
            // Inactive slides: hidden and out of document flow
            slide.classList.remove("uk-active");
            slide.style.display = "none";
            slide.style.opacity = "0";
            slide.style.position = "absolute"; // Out of document flow (overlayed)
          }
        });

        /**
         * Set up window resize handler
         * WHY: Need to recalculate container height when window size changes
         * CHANGE: Was using jQuery .on('resize'), now addEventListener
         */
        const resizeHandler = () => {
          this.resize();
        };

        window.addEventListener("resize", resizeHandler);
        window.addEventListener("load", resizeHandler);

        /**
         * Initial resize after a short delay
         * WHY: Images might not be fully loaded yet, slight delay ensures accurate height
         * 80ms is enough for most images to start loading
         */
        setTimeout(() => {
          this.resize();
        }, 80);

        /**
         * Start autoplay if enabled
         * WHY: Automatically advance slides without user interaction
         */
        if (this.options.autoplay) {
          this.start();
        }

        /**
         * Set up hover pause functionality
         * WHY: Users might want to read content, so pause on hover
         * CHANGE: Was using jQuery .on(), now addEventListener
         */
        if (this.options.pauseOnHover) {
          this.element.addEventListener("mouseenter", () => {
            this.hovering = true; // Flag checked in autoplay interval
          });

          this.element.addEventListener("mouseleave", () => {
            this.hovering = false; // Resume autoplay
          });
        }

        //Zepto.js Swiping Event
        this.element.addEventListener("swipeLeft", () => {
          this.stop();
          this.next();
          console.log("Swiped left!");
        });
        this.element.addEventListener("swipeRight", () => {
          this.stop();
          this.previous();
          console.log("Swiped right!");
        });

        return this; // Allow method chaining
      },

      /**
       * Recalculate and apply container height
       * WHY: Container needs fixed height for absolute positioned slides to work
       * CHANGE: Was using jQuery .css() and .height(), now direct style manipulation
       */
      resize() {
        // Skip if fullscreen (different sizing logic needed)
        if (this.element.classList.contains("uk-slideshow-fullscreen")) {
          return;
        }

        let height = this.options.height;

        /**
         * Auto-calculate height from tallest slide
         * WHY: Container should fit the tallest slide to prevent layout shift
         */
        if (this.options.height === "auto") {
          height = 0;

          /**
           * Find the tallest slide
           * CHANGE: Was using jQuery .each() and .height(), now forEach and offsetHeight
           * offsetHeight gives element's height including padding and border
           */
          this.slides.forEach((slide) => {
            slide.style.height = ""; // Clear any previous height
            const slideHeight = slide.offsetHeight;
            if (slideHeight > height) {
              height = slideHeight;
            }
          });
        }

        /**
         * Apply calculated height to container and all slides
         * WHY: Ensures consistent sizing and smooth transitions
         */
        if (height > 0) {
          this.container.style.height = height + "px";
          this.slides.forEach((slide) => {
            slide.style.height = height + "px";
          });
        }
      },

      /**
       * Show a specific slide by index
       * WHY: Core method for changing slides (used by next/previous/dots)
       * CHANGE: Simplified from UIkit's complex animation system
       *
       * @param {number} index - Index of slide to show
       */
      show(index, direction = null) {
        if (
          this.animating ||
          this.current === index ||
          index < 0 ||
          index >= this.slidesCount
        ) {
          return;
        }

        this.animating = true;

        const current = this.slides[this.current];
        const next = this.slides[index];

        if (!direction) {
          const isWrappingForward =
            this.current === this.slidesCount - 1 && index === 0;
          const isWrappingBackward =
            this.current === 0 && index === this.slidesCount - 1;

          if (isWrappingForward) {
            direction = "forward";
          } else if (isWrappingBackward) {
            direction = "backward";
          } else {
            direction = index > this.current ? "forward" : "backward";
          }
        }

        const animation = this.options.animation || "fade";

        this.applyAnimation(current, next, animation, direction).then(() => {
          current.classList.remove("uk-active");
          current.style.display = "none";
          current.style.position = "absolute";

          next.classList.add("uk-active");
          next.style.display = "block";
          next.style.position = "relative";

          this.current = index;
          this.animating = false;

          this.updateNavigation();
        });
      },

      /**
       * Apply transition animation between two slides
       * WHY: Creates smooth visual transition instead of instant swap
       * CHANGE: Replaced UIkit's complex animation system with simple CSS transitions
       *
       * @param {HTMLElement} current - Currently visible slide
       * @param {HTMLElement} next - Slide to transition to
       * @param {string} animation - Animation type (fade/scroll/swipe/scale)
       * @returns {Promise} Resolves when animation completes
       */
      applyAnimation(current, next, animation, direction = "forward") {
        return new Promise((resolve) => {
          const duration = this.options.duration;

          /**
           * Prepare next slide for animation
           * WHY: Need both slides visible during transition
           * Position absolute overlays next on top of current
           */
          next.style.display = "block";
          next.style.position = "absolute";
          next.style.top = "0";
          next.style.left = "0";
          next.style.width = "100%";
          next.style.opacity = "0"; // Start invisible

          /**
           * Force browser reflow/repaint
           * WHY: Ensures starting styles are applied before transition begins
           * Without this, browser might batch the style changes and skip animation
           * CHANGE: Was using jQuery .width(), now offsetHeight (any layout property works)
           */
          next.offsetHeight;

          /**
           * Set CSS transitions on both slides
           * WHY: Browser handles smooth animation via CSS (better performance than JS)
           * CHANGE: Direct style manipulation instead of jQuery
           */
          current.style.transition = `opacity ${duration}ms ease-in-out`;
          next.style.transition = `opacity ${duration}ms ease-in-out`;

          /**
           * Apply animation-specific transforms
           * WHY: Different animations need different CSS properties
           * CHANGE: Simplified from UIkit's animation classes to direct style manipulation
           */
          switch (animation) {
            case "fade":
              /**
               * Fade: Simple opacity transition
               * WHY: Most common and smooth animation type
               * Current fades out while next fades in
               */
              current.style.transition = `opacity ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.opacity = "0";
              next.style.opacity = "1";
              console.log("running fade : ", animation);
              break;

            case "scroll":
              /**
               * Scroll/Swipe: Horizontal slide effect
               * WHY: Gives sense of sliding through slides
               * Current slides left, next slides in from right
               */
              if (direction === "forward") {
                next.style.transform = "translateX(100%)";
                next.style.opacity = "0";
                next.offsetHeight;

                current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
                next.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;

                current.style.transform = "translateX(-100%)";
                current.style.opacity = "0";
                next.style.transform = "translateX(0)";
                next.style.opacity = "1";
              } else {
                next.style.transform = "translateX(-100%)";
                next.style.opacity = "0";
                next.offsetHeight;

                current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
                next.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;

                current.style.transform = "translateX(100%)";
                current.style.opacity = "0";
                next.style.transform = "translateX(0)";
                next.style.opacity = "1";
              }
              console.log("running scroll : ", animation);

              break;
            case "swipe":
              /**
               * Scroll/Swipe: Horizontal slide effect
               * WHY: Gives sense of sliding through slides
               * Current slides left, next slides in from right
               */
              if (direction === "forward") {
                next.style.transform = "translateX(100%)";
                next.style.opacity = "0";
                next.offsetHeight;

                current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
                next.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;

                current.style.transform = "translateX(-100%)";
                current.style.opacity = "0";
                next.style.transform = "translateX(0)";
                next.style.opacity = "1";
              } else {
                next.style.transform = "translateX(-100%)";
                next.style.opacity = "0";
                next.offsetHeight;

                current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
                next.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;

                current.style.transform = "translateX(100%)";
                current.style.opacity = "0";
                next.style.transform = "translateX(0)";
                next.style.opacity = "1";
              }
              console.log("running swipe : ", animation);

              break;

            case "scale":
              /**
               * Scale: Zoom effect
               * WHY: Creates depth perception, modern feel
               * Current shrinks away, next fades in
               */
              current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.transform = "scale(0.8)";
              current.style.opacity = "0";
              next.style.opacity = "1";
              console.log("running scale : ", animation);

              break;

            default:
              /**
               * Fallback to fade if unknown animation type
               * WHY: Ensures slideshow still works with invalid config
               */
              current.style.transition = `opacity ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.opacity = "0";
              next.style.opacity = "1";
              console.log("running default : ", animation);
          }

          /**
           * Wait for animation duration, then cleanup
           * WHY: Need to reset styles after transition completes
           * setTimeout duration matches CSS transition duration
           */
          setTimeout(() => {
            /**
             * Reset all transition and transform styles
             * WHY:
             * - Remove transitions so instant style changes don't animate
             * - Reset transforms so slides are in default position for next animation
             */
            current.style.transition = "";
            next.style.transition = "";
            current.style.transform = "";
            next.style.transform = "";

            resolve(); // Signal animation is complete
          }, duration);
        });
      },

      /**
       * Update navigation dots to reflect current slide
       * WHY: Visual feedback showing which slide is active
       * CHANGE: Was using jQuery .addClass()/.removeClass(), now classList
       */
      updateNavigation() {
        const dots = this.element.querySelectorAll(".uk-dotnav li");

        dots.forEach((dot, index) => {
          if (index === this.current) {
            dot.classList.add("uk-active"); // Highlight active dot
          } else {
            dot.classList.remove("uk-active"); // Remove highlight from others
          }
        });
      },

      /**
       * Show next slide in sequence
       * WHY: Used by next button and autoplay
       * Wraps around to first slide after last
       */
      next() {
        const nextIndex =
          this.current + 1 >= this.slidesCount ? 0 : this.current + 1;
        this.show(nextIndex);
      },

      /**
       * Show previous slide in sequence
       * WHY: Used by previous button
       * Wraps around to last slide before first
       */
      previous() {
        const prevIndex =
          this.current - 1 < 0 ? this.slidesCount - 1 : this.current - 1;
        this.show(prevIndex);
      },

      /**
       * Start autoplay timer
       * WHY: Automatically advance slides for carousel effect
       * CHANGE: Using native setInterval instead of jQuery patterns
       */
      start() {
        this.stop(); // Clear any existing interval first (prevents multiple timers)

        /**
         * Set up recurring timer
         * WHY: Call next() at regular intervals
         * Only advances if not hovering (respects pauseOnHover option)
         */
        this.interval = setInterval(() => {
          console.log("hovering : ", this.hovering);
          if (!this.hovering) {
            this.next();
          }
        }, this.options.autoplayInterval);
      },

      /**
       * Stop autoplay timer
       * WHY: Pause slideshow, used when user interacts or hovers
       * CHANGE: Direct clearInterval instead of jQuery patterns
       */
      stop() {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null; // Clear reference
        }
      },
    };

    /**
     * Return the slideshow object
     * WHY: Allows caller to access methods like show(), start(), stop()
     * This is the object that Alpine.js stores in this.slideshow
     */
    return slideshow;
  };
})();
