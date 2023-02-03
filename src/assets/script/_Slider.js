import { clampNumber } from "./_helpers"

class Slider {
	/**
 * @param {HTMLElement} element
 * @param {{
 * perPage: number,
 * startFrom: number
 * }} options
 */
	constructor(element, options = {}) {
		this.slider = element
		this.pagination = element.querySelector(".slider__pagination")
		this.track = element.querySelector(".slider__track")
		this.list = this.track.querySelector(".slider__list")
		this.slides = [...this.list.querySelectorAll(".slider__slide")]
		this.length = this.slides.length - 1
		this.lock = false
		this.currentSlide = options.startFrom ?? 0
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

		element.style.setProperty("--perPage", options.perPage ?? 1)

		this.observeSlides()
		this.printPagination()
		this.bindSlideEvents()
		this.calcWidth()
		this.set()
	}

	observeSlides() {
		this.slides.forEach(slide => {
			this.slidesObserver.observe(slide)
		})
	}

	bindSlideEvents() {
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
		this.currentSlide = clampNumber(0, targetIndex, this.length)
		this.slides[this.currentSlide].scrollIntoView({
			inline: "start",
			behavior: smooth ? "smooth" : "auto"
		})
	}

	calcWidth() {
		this.slider.style.setProperty("--slider-width", `${this.track.clientWidth}px`)
	}

	set() {
		this.slide(this.currentSlide, false)
	}

	initWheel() {
		this.list.addEventListener("wheel", (event) => {
			this.slide(this.currentSlide + Math.sign(event.deltaX))
		})
	}
}

export default Slider