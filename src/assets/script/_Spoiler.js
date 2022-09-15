import { makeSlideToggle } from "./_helpers"

class Spoiler {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.spoiler = target
		this.toggler = target.querySelector('.spoiler__toggler')
		this.content = target.querySelector('.spoiler__content')
		this.slideToggle = makeSlideToggle(this.content)
		this.activeClass = "is-active"

		this.init()
	}

	init() {
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
