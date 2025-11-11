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
      show(index) {
        /**
         * prevent invalid operations
         * WHY:
         * - animating: Prevent clicks during transition (causes visual glitches)
         * - current === index: No need to show already-active slide
         */
        if (
          this.animating ||
          this.current === index ||
          index < 0 ||
          index >= this.slidesCount
        ) {
          return;
        }

        this.animating = true; // Lock to prevent concurrent animations

        const current = this.slides[this.current]; // Currently visible slide
        const next = this.slides[index]; // Slide to show
        const animation = this.options.animation || "fade";

        /**
         * Apply animation, then update state when complete
         * WHY: Animation is async (takes time), need to wait before cleanup
         * CHANGE: Using Promises instead of jQuery Deferred
         */
        this.applyAnimation(current, next, animation).then(() => {
          /**
           * Cleanup after animation
           * WHY: Hide old slide completely and finalize new slide position
           */
          current.classList.remove("uk-active");
          current.style.display = "none";
          current.style.position = "absolute"; // Stack on top for future transitions

          next.classList.add("uk-active");
          next.style.display = "block";
          next.style.position = "relative"; // In document flow (visible)

          this.current = index; // Update current slide index
          this.animating = false; // Unlock for next transition

          /**
           * Update navigation dots to reflect new active slide
           */
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
      applyAnimation(current, next, animation) {
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
              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            case "scroll":
            case "swipe":
              /**
               * Scroll/Swipe: Horizontal slide effect
               * WHY: Gives sense of sliding through slides
               * Current slides left, next slides in from right
               */
              current.style.transform = "translateX(-100%)";
              current.style.opacity = "0";
              next.style.transform = "translateX(0)";
              next.style.opacity = "1";
              break;

            case "scale":
              /**
               * Scale: Zoom effect
               * WHY: Creates depth perception, modern feel
               * Current shrinks away, next fades in
               */
              current.style.transform = "scale(0.8)";
              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            default:
              /**
               * Fallback to fade if unknown animation type
               * WHY: Ensures slideshow still works with invalid config
               */
              current.style.opacity = "0";
              next.style.opacity = "1";
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
