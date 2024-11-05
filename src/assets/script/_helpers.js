/**
 *	@description Блокирует {@link true} или разблокирует {@link false}  прокрутку страницы
 * @param {Boolean} action
 */

import Splide from "@splidejs/splide"
// import { Grid } from "@splidejs/splide-extension-grid"
import { childGalleryPropertyName } from "./_gallery"

const toggleNoscrollBody = (function () {
	let scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
	return function (action) {
		function disable() {
			document.documentElement.style.setProperty("--scrollbar-width", `${scrollBarWidth}px`)
			document.body.classList.add("noscroll")
		}

		function enable() {
			document.body.classList.remove("noscroll")
		}

		function toggle() {
			document.body.classList.contains("noscroll") ? enable() : disable()
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
 * @param {HTMLElement} counter
 */
export function bindSplideCounter(splide, counter) {
	splide.on("mounted", () => {
		counter.style.setProperty("--splide-page-current", splide.index + 1)
		counter.style.setProperty("--splide-page-total", splide.Components.Slides.getLength())
	})

	splide.on("moved", (newPos) => {
		counter.style.setProperty("--splide-page-current", newPos + 1)
	})
}

function setVh() {
	document.documentElement.style.setProperty("--vh", `${visualViewport.height / 100}px`)
	visualViewport.addEventListener("resize", () => {
		document.documentElement.style.setProperty("--vh", `${visualViewport.height / 100}px`)
	})
}

/**
 *
 * @param {Splide} splide
 * @param {HTMLElement[]} arrows
 */
function bindSplideArrows(splide, arrows) {
	arrows.forEach(arrows => {

		let arrow_prev = arrows.querySelector(".splide__arrow--prev")
		let arrow_next = arrows.querySelector(".splide__arrow--next")

		function setArrowsState(current_index = 0) {
			arrow_prev.toggleAttribute("disabled", current_index == 0)
			arrow_next.toggleAttribute("disabled", current_index == splide.Components.Controller.getEnd())
		}

		arrow_prev.addEventListener("click", () => {
			splide.go("<")
		})

		arrow_next.addEventListener("click", () => {
			splide.go(">")
		})

		splide.on("overflow", isOverflow => {
			arrows.classList.toggle("is-disabled", !isOverflow)
		})

		splide.on("moved", setArrowsState)
		splide.on("mounted", setArrowsState)
	})

	return splide
}

/**
 * @param {import("@splidejs/splide").Options} options 
 * @param {string} selector 
 */
function makeSplide(selector, options) {
	document.querySelectorAll(selector).forEach(container => {
		let slider = container.querySelector(".splide")
		let arrows = container.querySelectorAll(".splide__arrows")
		let counter = container.querySelector(".splide__counter")
		let splide = new Splide(slider, options)
		let childGallery = slider[childGalleryPropertyName]

		disableSplideDragOverflow(splide)

		if (arrows.length) { bindSplideArrows(splide, arrows) }
		if (counter) { bindSplideCounter(splide, counter) }
		if (options.grid) { syncSplideGridToStyle(splide, container) }
		if (childGallery) { splide.sync(childGallery) }
		splide.mount({
			// Grid
		})
		childGallery.mount()
	})
}

/**
 * 
 * @param {Splide} splide 
 */
function disableSplideDragOverflow(splide) {
	splide.on("overflow", isOverflow => {
		splide.options = {
			drag: isOverflow
		}
	})
}

/**
 *
 * @param {Splide} splide
 * @param {HTMLElement} container
 */
function syncSplideGridToStyle(splide, container) {
	function setStyle() {
		container.style.setProperty("--splide-grid-row-gap", `${splide.options.grid.gap.row}px`)
		container.style.setProperty("--splide-grid-col-gap", `${splide.options.grid.gap.col}px`)
	}
	setStyle()
	splide.on("updated", setStyle)
}

function headerHeightToCSS() {
	let header = document.body.querySelector("header")

	function setSize() {
		document.documentElement.style.setProperty("--header-height", `${header.getClientRects()[0].height}px`)
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

export { toggleNoscrollBody, ifClickInside, bindSplideArrows, headerHeightToCSS, breakpoints, syncSplideGridToStyle, makeSplide, disableSplideDragOverflow }