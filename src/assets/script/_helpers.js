/**
 *	@description Блокирует {@link true} или разблокирует {@link false}  прокрутку страницы
 * @param {Boolean} action
 */
function toggleNoscrollBody(action) {
	function disable() {
		document.documentElement.style.setProperty("--scroll-position", `${window.scrollY}px`)
		document.documentElement.style.setProperty("--scrollbar-width", `${window.innerWidth - document.documentElement.clientWidth}px`)
		document.body.classList.add('noscroll')
	}

	function enable() {
		document.body.classList.remove('noscroll')
		window.scrollTo({
			top: document.documentElement.style.getPropertyValue('--scroll-position').replace('px', ""),
			left: 0,
			behavior: "instant"
		})
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

/**
 *
 * @param {Event} event
 * @param {Array.<Element>} targets
 * @returns
 */
function ifClickInside(event, targets) {
	let path = event.composedPath()
	return targets.some(target => {
		return path.includes(target)
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
	document.documentElement.style.setProperty('--header-height', `${document.querySelector('header').getBoundingClientRect().height}px`)
}

function isVarName(name) {
	if (typeof name !== 'string') {
		return false
	}

	if (name.trim() !== name) {
		return false
	}

	try {
		new Function(name, 'var ' + name)
	} catch (_) {
		return false
	}

	return true
}

let breakpoints = (() => {
	let style = getComputedStyle(document.documentElement)
	return {
		mobile: parseInt(style.getPropertyValue("--mobile")),
		tablet: parseInt(style.getPropertyValue("--tablet")),
		laptop: parseInt(style.getPropertyValue("--laptop"))
	}
})()

export { toggleNoscrollBody, ifClickInside, bindSplideArrows, headerHeightToCSS, isVarName, breakpoints }