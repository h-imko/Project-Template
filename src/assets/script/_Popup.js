import { ifClickInside, isVarName, toggleNoscrollBody } from "./_helpers"

class Popup {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.activeClass = "is-active"
		this.popup = target
		this.name = this.popup.dataset.popup
		this.inner = this.popup.querySelector("[data-popup-inner]")
		this.controllers = [...document.querySelectorAll(`[data-popup-target="${this.name}"]`)]
		this.openers = this.controllers.filter(controller => controller.dataset.popupControl == "open")
		this.togglers = this.controllers.filter(controller => controller.dataset.popupControl == "toggle")
		this.closers = [...this.controllers.filter(controller => controller.dataset.popupControl == "close"), ...this.popup.querySelectorAll("[data-popup-selfcloser]")]
		this.initControllers()
		this.bindGlobalControls()
	}

	updateControllers() {
		[...this.openers, ...this.togglers].forEach((controller) => {
			controller.classList.toggle(this.activeClass, this.popup.classList.contains(this.activeClass))
		})
	}

	/**
	 *
	 * @param {Event} event
	 */
	closePopup(event) {
		this.popup.classList.remove(this.activeClass)
		toggleNoscrollBody(false)
		this.updateControllers()
	}

	/**
	 *
	 * @param {Event} event
	 */
	openPopup(event) {
		this.popup.classList.add(this.activeClass)
		toggleNoscrollBody(true)
		this.updateControllers()
	}

	/**
	 *
	 * @param {Event} event
	 */
	togglePopup(event) {
		this.popup.classList.toggle(this.activeClass)
		toggleNoscrollBody()
		this.updateControllers()
	}

	initControllers() {
		this.openers.forEach((opener) => {
			opener.addEventListener('click', () => {
				this.openPopup()
			})
		})

		this.togglers.forEach((toggler) => {
			toggler.addEventListener('click', () => {
				this.togglePopup()
			})
		})

		this.closers.forEach((closer) => {
			closer.addEventListener('click', () => {
				this.closePopup()
			})
		})

		document.addEventListener('click', (event) => {
			if (!ifClickInside(event, [this.inner, ...this.openers, ...this.togglers, ...this.closers]) && this.popup.classList.contains(this.activeClass)) {
				this.closePopup(event)
			}
		})
	}
}

export default Popup