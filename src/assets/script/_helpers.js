/**
 *	@description Блокирует {@link true} или разблокирует {@link false}  прокрутку страницы
 * @param {Boolean} action
 */

const toggleNoscrollBody = (function () {
	let scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
	return function (action) {
		function disable() {
			document.documentElement.style.setProperty("--scrollbar-width", `${scrollBarWidth}px`)
			document.body.classList.add('noscroll')
		}

		function enable() {
			document.body.classList.remove('noscroll')
		}

		function toggle() {
			document.body.classList.contains('noscroll') ? enable() : disable()
		}

		if (typeof action !== "undefined") {
			if (action) {
				disable()
			} else {
				enable()
			}
		} else {
			toggle()
		}
	}
})()

/**
 *
 * @param {Event} event
 * @param {Array.<Element>} targets
 * @returns
 */
function ifClickInside(event, ...targets) {
	return targets.some(target => {
		return event.composedPath().includes(target)
	})
}

/**
 *
 * @param {Splide} splide
 * @param {HTMLElement} arrows
 */
function bindSplideArrows(splide, arrows) {
	let arrow_prev = arrows.querySelector(".splide__arrow--prev")
	let arrow_next = arrows.querySelector(".splide__arrow--next")

	function setArrowsState(current_index = 0) {
		arrow_prev.toggleAttribute("disabled", current_index == 0)
		arrow_next.toggleAttribute("disabled", current_index == splide.Components.Slides.getLength() - splide.options.perPage)
	}

	arrow_prev.addEventListener("click", function () {
		splide.go('<')
	})

	arrow_next.addEventListener("click", function () {
		splide.go('>')
	})

	splide.on("moved", setArrowsState)
	splide.on("mounted", setArrowsState)

	setArrowsState()
}

function headerHeightToCSS() {
	let header = document.body.querySelector('header')

	function setSize() {
		document.documentElement.style.setProperty('--header-height', `${header.getClientRects()[0].height}px`)
	}

	setSize()

	new ResizeObserver(() => {
		setSize()
	}).observe(header)
}

const breakpoints = (() => {
	let style = getComputedStyle(document.documentElement)
	return {
		mobile: parseInt(style.getPropertyValue("--mobile")),
		tablet: parseInt(style.getPropertyValue("--tablet")),
		laptop: parseInt(style.getPropertyValue("--laptop"))
	}
})()

export { toggleNoscrollBody, ifClickInside, bindSplideArrows, headerHeightToCSS, breakpoints }