import { clampNumber } from "./_helpers"

class Slider {
	/**
 * @param {HTMLElement} element
 * @param {{
 * perPage: number,
 * startFrom: number,
 * gap: number|string
 * }} options
 */
	constructor(element, { startFrom = 0, gap = 0, perPage = 1 } = {}) {
		this.options = {
			startFrom: startFrom,
			gap: gap,
			perPage: perPage
		}

		this.slider = element
		this.pagination = element.querySelector(".slider__pagination")
		this.track = element.querySelector(".slider__track")
		this.list = this.track.querySelector(".slider__list")
		this.slides = [...this.list.querySelectorAll(".slider__slide")]
		this.length = this.slides.length - 1
		this.lock = false

		this.slidesObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.dispatchEvent(new CustomEvent("slideIn"))
				} else {
					entry.target.dispatchEvent(new CustomEvent("slideOut"))
				}
			})
		}, {
			root: this.track,
			threshold: 0.5
		})
		this.resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				entry.target.dispatchEvent(new CustomEvent("resized"))
			}
		})

		this.injectCSS()
		this.observeSlides()
		this.observeSlideResize()
		this.printPagination()
		this.bindSlidesEvents()
		this.bindSliderEvents()
		this.calcWidth()
		this.set()
	}

	injectCSS() {
		Object.entries(this.options).forEach(([key, value]) => {
			this.slider.style.setProperty(`--${key}`, value)
		})
	}

	bindSliderEvents() {
		this.slider.addEventListener("resized", () => {
			this.calcWidth()
		})
	}

	observeSlideResize() {
		this.resizeObserver.observe(this.slider)
	}

	observeSlides() {
		this.slides.forEach(slide => {
			this.slidesObserver.observe(slide)
		})
	}

	bindSlidesEvents() {
		this.slides.forEach(slide => {
			slide.addEventListener("slideIn", () => {
				slide.classList.add("slider__slide--visible")
			})
			slide.addEventListener("slideOut", () => {
				slide.classList.remove("slider__slide--visible")
			})
		})
	}

	printPagination() {
		this.slides.forEach((slide, index) => {
			let page = document.createElement("li")
			page.classList.add("slider__pagination__page")
			slide.addEventListener("slideIn", () => {
				page.classList.add("slider__pagination__page--visible")
			})
			slide.addEventListener("slideOut", () => {
				page.classList.remove("slider__pagination__page--visible")
			})
			page.addEventListener("click", () => {
				this.slide(index)
			})
			this.pagination.append(page)
		})
	}

	/**
	 *
	 * @param {number} targetIndex
	 * @param {boolean} smooth
	 */
	slide(targetIndex, smooth = true) {
		targetIndex = clampNumber(0, targetIndex ?? 0, this.length)
		this.slides[targetIndex].scrollIntoView({
			inline: "start",
			behavior: smooth ? "smooth" : "auto"
		})
	}

	calcWidth() {
		this.slider.style.setProperty("--slider-width", `${this.track.clientWidth}px`)

	}

	set() {
		this.slide(this.options.startFrom, false)
	}
}

export default Slider