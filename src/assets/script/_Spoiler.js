
class Spoiler {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.spoiler = target
		this.toggler = target.querySelector('.spoiler__toggler')
		this.content = target.querySelector('.spoiler__content')
		this.controller = target.querySelector('.spoiler__controller')
		this.isNative = this.toggler.hasAttribute("for")

		if (!this.isNative) {
			this.initToggler()
		}
	}

	initToggler() {
		this.toggler.addEventListener("click", () => {
			this.controller.checked = !this.controller.checked
		})
	}
}

export default Spoiler
