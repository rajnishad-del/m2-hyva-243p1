// Based on Zepto.js touch.js
// Zepto.js may be freely distributed under the MIT license.

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

  window.awRbslider = function (element, config) {
    const slideshow = {
      options: Object.assign(
        {
          animation: "fade",
          duration: 500,
          height: "auto",
          start: 0,
          autoplay: false,
          autoplayInterval: 7000,
          pauseOnHover: true,
        },
        config || {}
      ),

      current: 0,
      interval: null,
      hovering: false,
      element: element,
      container: null,
      slides: [],
      slidesCount: 0,
      animating: false,

      init() {
        this.container = this.element.classList.contains("uk-slideshow")
          ? this.element
          : this.element.querySelector(".uk-slideshow");

        if (!this.container) {
          return;
        }

        this.current = this.options.start;
        this.animating = false;
        this.slides = Array.from(
          this.container.querySelectorAll(".aw-rbslider-item")
        );
        this.slidesCount = this.slides.length;

        if (this.slidesCount === 0) {
          return;
        }

        this.slides.forEach((slide, index) => {
          if (index === this.current) {
            slide.classList.add("uk-active");
            slide.style.display = "block";
            slide.style.opacity = "1";
            slide.style.position = "relative";
          } else {
            slide.classList.remove("uk-active");
            slide.style.display = "none";
            slide.style.opacity = "0";
            slide.style.position = "absolute";
          }
        });

        const resizeHandler = () => {
          this.resize();
        };

        window.addEventListener("resize", resizeHandler);
        window.addEventListener("load", resizeHandler);

        setTimeout(() => {
          this.resize();
        }, 80);

        if (this.options.autoplay) {
          this.start();
        }

        if (this.options.pauseOnHover) {
          this.element.addEventListener("mouseenter", () => {
            this.hovering = true;
          });

          this.element.addEventListener("mouseleave", () => {
            this.hovering = false;
          });
        }

        //Zepto.js Swiping Event
        this.element.addEventListener("swipeLeft", () => {
          this.stop();
          this.next();
        });
        this.element.addEventListener("swipeRight", () => {
          this.stop();
          this.previous();
        });

        return this;
      },

      resize() {
        if (this.element.classList.contains("uk-slideshow-fullscreen")) {
          return;
        }

        let height = this.options.height;

        if (this.options.height === "auto") {
          height = 0;
          this.slides.forEach((slide) => {
            slide.style.height = "";
            const slideHeight = slide.offsetHeight;
            if (slideHeight > height) {
              height = slideHeight;
            }
          });
        }

        if (height > 0) {
          this.container.style.height = height + "px";
          this.slides.forEach((slide) => {
            slide.style.height = height + "px";
          });
        }
      },

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

      applyAnimation(current, next, animation, direction = "forward") {
        return new Promise((resolve) => {
          const duration = this.options.duration;

          next.style.display = "block";
          next.style.position = "absolute";
          next.style.top = "0";
          next.style.left = "0";
          next.style.width = "100%";
          next.style.opacity = "0";

          next.offsetHeight;

          switch (animation) {
            case "fade":
              current.style.transition = `opacity ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            case "scroll":
            case "swipe":
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
              break;

            case "scale":
              current.style.transition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.transform = "scale(0.8)";
              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            default:
              current.style.transition = `opacity ${duration}ms ease-in-out`;
              next.style.transition = `opacity ${duration}ms ease-in-out`;

              current.style.opacity = "0";
              next.style.opacity = "1";
          }

          setTimeout(() => {
            current.style.transition = "";
            next.style.transition = "";
            current.style.transform = "";
            next.style.transform = "";

            resolve();
          }, duration);
        });
      },

      updateNavigation() {
        const dots = this.element.querySelectorAll(".uk-dotnav li");
        dots.forEach((dot, index) => {
          if (index === this.current) {
            dot.classList.add("uk-active");
          } else {
            dot.classList.remove("uk-active");
          }
        });
      },

      next() {
        const nextIndex =
          this.current + 1 >= this.slidesCount ? 0 : this.current + 1;
        this.show(nextIndex, "forward");
      },

      previous() {
        const prevIndex =
          this.current - 1 < 0 ? this.slidesCount - 1 : this.current - 1;
        this.show(prevIndex, "backward");
      },

      start() {
        this.stop();

        this.interval = setInterval(() => {
          if (!this.hovering) {
            this.next();
          }
        }, this.options.autoplayInterval);
      },

      stop() {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
      },
    };

    return slideshow;
  };
})();
