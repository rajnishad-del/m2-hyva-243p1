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
          console.error("Slideshow container not found");
          return;
        }

        this.current = this.options.start;
        this.animating = false;
        this.slides = Array.from(
          this.container.querySelectorAll(".aw-rbslider-item")
        );
        this.slidesCount = this.slides.length;

        if (this.slidesCount === 0) {
          console.error("No slides found");
          return;
        }

        // Set initial state
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

        // Set up resize handler
        const resizeHandler = () => {
          this.resize();
        };

        window.addEventListener("resize", resizeHandler);
        window.addEventListener("load", resizeHandler);

        // Initial resize
        setTimeout(() => {
          this.resize();
        }, 80);

        // Set autoplay
        if (this.options.autoplay) {
          this.start();
        }

        // Set up hover pause
        if (this.options.pauseOnHover) {
          this.element.addEventListener("mouseenter", () => {
            this.hovering = true;
          });

          this.element.addEventListener("mouseleave", () => {
            this.hovering = false;
          });
        }

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

      show(index) {
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
        const animation = this.options.animation || "fade";

        // Apply animation
        this.applyAnimation(current, next, animation).then(() => {
          current.classList.remove("uk-active");
          current.style.display = "none";
          current.style.position = "absolute";

          next.classList.add("uk-active");
          next.style.display = "block";
          next.style.position = "relative";

          this.current = index;
          this.animating = false;

          // Update navigation dots
          this.updateNavigation();
        });
      },

      applyAnimation(current, next, animation) {
        return new Promise((resolve) => {
          const duration = this.options.duration;

          // Show next slide
          next.style.display = "block";
          next.style.position = "absolute";
          next.style.top = "0";
          next.style.left = "0";
          next.style.width = "100%";
          next.style.opacity = "0";

          // Force reflow
          next.offsetHeight;

          // Set transition
          current.style.transition = `opacity ${duration}ms ease-in-out`;
          next.style.transition = `opacity ${duration}ms ease-in-out`;

          // Apply animation based on type
          switch (animation) {
            case "fade":
              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            case "scroll":
            case "swipe":
              current.style.transform = "translateX(-100%)";
              current.style.opacity = "0";
              next.style.transform = "translateX(0)";
              next.style.opacity = "1";
              break;

            case "scale":
              current.style.transform = "scale(0.8)";
              current.style.opacity = "0";
              next.style.opacity = "1";
              break;

            default:
              current.style.opacity = "0";
              next.style.opacity = "1";
          }

          // Wait for animation to complete
          setTimeout(() => {
            // Reset transitions
            current.style.transition = "";
            next.style.transition = "";
            current.style.transform = "";
            next.style.transform = "";

            resolve();
          }, duration);
        });
      },

      updateNavigation() {
        // Update dot navigation
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
        this.show(nextIndex);
      },

      previous() {
        const prevIndex =
          this.current - 1 < 0 ? this.slidesCount - 1 : this.current - 1;
        this.show(prevIndex);
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
