
class Spoiler {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.spoiler = target
		this.toggler = target.querySelector('.spoiler__toggler')
		this.content = target.querySelector('.spoiler__content')
		this.slideToggle = this.makeSlideToggle(this.content)
		this.activeClass = "is-active"
		this.nestedSpoilers = target.querySelectorAll(".spoiler")
		this.transition = +target.dataset?.spoilerTransition || 0
		this.initClick()
		this.watch()
		this.injectTransition()
	}

	makeSlideToggle(elem) {
		let initialHeight = getComputedStyle(elem).maxHeight

		return function () {
			let currentMaxHeight = elem.style.getPropertyValue("max-height")

			if (currentMaxHeight == "") {
				elem.style.setProperty("max-height", `${elem.scrollHeight}px`)
			} else if (currentMaxHeight != initialHeight) {
				elem.style.setProperty("max-height", initialHeight)
			} else {
				elem.style.setProperty("max-height", `${elem.scrollHeight}px`)
			}
		}
	}

	injectTransition() {
		if (this.transition) {
			this.spoiler.style.setProperty("--transition-duration", `${this.transition / 1000}s`)
		}
	}

	initClick() {
		this.toggler?.addEventListener('click', () => {
			this.slideToggle()
			this.toggler.classList.toggle(this.activeClass)
			this.content.classList.toggle(this.activeClass)
			this.spoiler.classList.toggle(this.activeClass)
		})
		if (this.spoiler.dataset?.spoilerDefaultOpened) {
			this.slideToggle()
		}
	}

	resetMaxHeight() {
		if (this.content.classList.contains(this.activeClass)) {
			setTimeout(() => {
				this.content.style.setProperty("max-height", `${this.content.scrollHeight}px`)
			}, this.transition + 100)
		}
	}

	watch() {
		new MutationObserver(() => {
			this.resetMaxHeight()
		}).observe(this.spoiler, { attributes: true, subtree: true })
	}
}

export { Spoiler }
