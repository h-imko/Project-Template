
class Spoiler {
	/**
	 *
	 * @param {HTMLElement} target
	 */
	constructor(target) {
		this.spoiler = target
		this.togglers = [target.querySelector('.spoiler__toggler'), ...document.querySelectorAll(`[data-spoiler-target="${this.spoiler.id}"]`)]
		this.content = target.querySelector('.spoiler__content')
		this.activeClass = "is-active"
		console.log(this.togglers)

		this.initClick()
	}

	initClick() {
		let style = this.spoiler.style
		let height

		this.togglers.forEach(toggler => {
			toggler.addEventListener('click', () => {
				height = `${this.content.scrollHeight}px`

				if (style.getPropertyValue("--scroll-height") != height) {
					style.setProperty("--scroll-height", height)
					style.setProperty("--transition", `none`)
					requestAnimationFrame(() => {
						style.removeProperty("--transition")
					})
				}

				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						this.togglers.forEach(toggler => {
							toggler.classList.toggle(this.activeClass)
						})
						this.content.classList.toggle(this.activeClass)
						this.spoiler.classList.toggle(this.activeClass)
					})
				})
			})
		})
	}
}

export default Spoiler
