import { ifClickInside, toggleNoscrollBody } from "./_helpers"

class Popup {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.activeClass = "is-active"
		this.initializedClass = Popup.#initializedClass
		this.stateAttribute = Popup.#stateAttribute
		this.element = target
		this.name = this.element.dataset.popup
		this.inner = this.element.querySelector("[data-popup-inner]")
		this.controllers = [...document.querySelectorAll(`[data-popup-target="${this.name}"]`)]
		this.openers = this.controllers.filter(controller => controller.dataset.popupControl == "open")
		this.togglers = this.controllers.filter(controller => controller.dataset.popupControl == "toggle")
		this.closers = [...this.controllers.filter(controller => controller.dataset.popupControl == "close"), ...this.element.querySelectorAll("[data-popup-selfcloser]")]
		this.ignoreDocument = this.element.hasAttribute("data-popup-ignore-document")

		this.setState()
		this.element.addEventListener("stateChanged", () => {
			this.setState()
		})
		this.initControllers()
		this.element.classList.add(Popup.#initializedClass)
	}

	static #stateAttribute = "data-popup-is-active"
	static #initializedClass = "is-initialized"

	static initPopups() {
		window.popups = {};

		[...document.querySelectorAll(`[data-popup]:not(.${Popup.#initializedClass})`)].forEach(popup => {
			window.popups[popup.dataset.popup] = new Popup(popup)
		})

		this.#ObserveStates(window.popups)
	}

	static #ObserveStates(popups) {
		let observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.target.dispatchEvent(new Event("stateChanged"))
			})
		})

		Object.values(popups).forEach(popup => {
			observer.observe(popup.element, { attributes: true, attributeFilter: [Popup.#stateAttribute] })
		})
	}

	setState() {
		let isActive = this.element.hasAttribute(this.stateAttribute)
		toggleNoscrollBody(isActive)
		this.updateControllers(isActive)
		this.element.classList.toggle(this.activeClass, isActive)
	}

	updateControllers(isActive) {
		[...this.openers, ...this.togglers, ...this.closers].forEach((controller) => {
			controller.toggleAttribute(this.stateAttribute, isActive)
		})
	}

	initControllers() {
		this.openers.forEach((opener) => {
			opener.addEventListener('click', () => {
				this.element.toggleAttribute(this.stateAttribute, true)
			})
		})

		this.togglers.forEach((toggler) => {
			toggler.addEventListener('click', () => {
				this.element.toggleAttribute(this.stateAttribute)
			})
		})

		this.closers.forEach((closer) => {
			closer.addEventListener('click', () => {
				this.element.toggleAttribute(this.stateAttribute, false)
			})
		})

		if (!this.ignoreDocument) {
			document.addEventListener('click', (event) => {
				if (!ifClickInside(event, [this.inner, ...this.openers, ...this.togglers, ...this.closers]) && this.element.hasAttribute(this.stateAttribute)) {
					this.element.toggleAttribute(this.stateAttribute, false)
				}
			})
		}
	}
}

export default Popup