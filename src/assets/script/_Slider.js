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
		this.track = element.querySelector(".slider__track")
		this.list = this.track.querySelector(".slider__list")
		this.slides = [...this.list.querySelectorAll(".slider__slide")]
		this.length = this.slides.length - 1
		this.lock = false

		element.style.setProperty("--perPage", options.perPage ?? 1)
		this.currentSlide = options.startFrom ?? 0

		this.set()
		// this.initWheel()

		// this.list.addEventListener("touchmove", (event)=>{
		// 	console.log(event.changedTouches[0])

		// })
	}

	/**
	 *
	 * @param {number} targetIndex
	 * @param {boolean} smooth
	 */
	slide(targetIndex, smooth = true) {
		// requestAnimationFrame(() => {
			// requestAnimationFrame(() => {
				this.currentSlide = clampNumber(0, targetIndex, this.length)
				this.slides[this.currentSlide].scrollIntoView({
					inline: "start",
					behavior: smooth ? "smooth" : "auto"
				})
			// })
		// })
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