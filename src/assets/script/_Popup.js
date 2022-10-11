import { ifClickInside, toggleNoscrollBody } from "./_helpers"

class Popup {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.openedClass = "show"
		this.popup = target
		this.inner = target.querySelector(".popup__inner")
		this.controllers = [...document.querySelectorAll(`[data-popup-target="${target.id}"]`)]
		this.openers = this.controllers.filter(controller => controller.dataset.popupControl == "open")
		this.togglers = this.controllers.filter(controller => controller.dataset.popupControl == "toggle")
		this.closers = [...this.controllers.filter(controller => controller.dataset.popupControl == "close"), ...target.querySelectorAll(".popup__selfcloser")]
		this.initControllers()
		this.bindGlobalControls()
	}

	updateControllers() {
		if (this.popup.classList.contains(this.openedClass)) {
			[...this.openers, ...this.togglers].forEach(function (controller) {
				controller.classList.add("popup-controller--active")
			})
		} else {
			[...this.openers, ...this.togglers].forEach(function (controller) {
				controller.classList.remove("popup-controller--active")
			})
		}
	}

	/**
	 *
	 * @param {Event} event
	 */
	closePopup(event) {
		this.popup.classList.remove(this.openedClass)
		toggleNoscrollBody(false)
		this.updateControllers()
	}

	/**
	 *
	 * @param {Event} event
	 */
	openPopup(event) {
		this.popup.classList.add(this.openedClass)
		toggleNoscrollBody(true)
		this.updateControllers()
	}

	/**
	 *
	 * @param {Event} event
	 */
	togglePopup(event) {
		this.popup.classList.toggle(this.openedClass)
		toggleNoscrollBody()
		this.updateControllers()
	}

	/**
	 * Выносит в свойства {@link Window} методы контроля попапа - {@link closePopup}, {@link openPopup}, {@link togglePopup} с именами соответственно [действие]Popup_[id попапа]
	 * @example <caption>закрывает попап с айди my_cool_popup</caption>
	 * window.closePopup_my_cool_popup()
	 */
	bindGlobalControls() {
		window[`closePopup_${this.popup.id}`] = this.closePopup.bind(this)
		window[`openPopup_${this.popup.id}`] = this.openPopup.bind(this)
		window[`togglePopup_${this.popup.id}`] = this.togglePopup.bind(this)
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
			if (!ifClickInside(event, [this.inner, ...this.openers, ...this.togglers, ...this.closers]) && this.popup.classList.contains(this.openedClass)) {
				this.closePopup(event)
			}
		})
	}
}

export default Popup