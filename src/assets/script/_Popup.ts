import { ifClickInside, toggleNoscrollBody } from "./_helpers"

class Popup {
	openedClass: "show"
	popup: HTMLElement
	inner: HTMLElement
	controllers: HTMLElement[]
	openers: HTMLElement[]
	closers: HTMLElement[]
	togglers: HTMLElement[]

	constructor(target: HTMLElement) {
		this.inner = target.querySelector(".popup__inner")
		this.controllers = [...document.querySelectorAll<HTMLElement>(`[data-popup-target="${target.id}"]`)]
		this.openers = this.controllers.filter(controller => controller.dataset.popupControl == "open")
		this.togglers = this.controllers.filter(controller => controller.dataset.popupControl == "toggle")
		this.closers = [...this.controllers.filter(controller => controller.dataset.popupControl == "close"), ...target.querySelectorAll<HTMLElement>(".popup__selfcloser")]
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

	close() {
		this.popup.classList.remove(this.openedClass)
		toggleNoscrollBody(false)
		this.updateControllers()
	}

	open() {
		this.popup.classList.add(this.openedClass)
		toggleNoscrollBody(true)
		this.updateControllers()
	}

	toggle() {
		this.popup.classList.toggle(this.openedClass)
		toggleNoscrollBody()
		this.updateControllers()
	}

	initControllers() {
		this.openers.forEach((opener) => {
			opener.addEventListener('click', () => {
				this.open()
			})
		})

		this.togglers.forEach((toggler) => {
			toggler.addEventListener('click', () => {
				this.toggle()
			})
		})

		this.closers.forEach((closer) => {
			closer.addEventListener('click', () => {
				this.close()
			})
		})

		document.addEventListener('click', (event) => {
			if (!ifClickInside(event, [this.inner, ...this.openers, ...this.togglers, ...this.closers]) && this.popup.classList.contains(this.openedClass)) {
				this.close()
			}
		})
	}
}

export default Popup