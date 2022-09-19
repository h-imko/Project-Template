
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
		this.duration = +target.dataset?.spoilerDuration || 0
		this.initClick()
		this.injectDuration()
	}

	makeSlideToggle(elem) {
		return function () {
			elem.style.setProperty("max-height", `${elem.scrollHeight}px`)
			setTimeout(() => {
				elem.style.removeProperty("max-height")
			}, this.duration)
		}


	}

	injectDuration() {
		this.spoiler.style.setProperty("--transition-duration", `${this.duration / 1000}s`)
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
}

export { Spoiler }
