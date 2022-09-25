function toggleNoscrollBody(action?: Boolean) {
	function disable() {
		document.body.style.setProperty("--scroll-position", `${window.pageYOffset}px`)
		document.body.style.setProperty("--scrollbar-width", `${window.innerWidth - document.documentElement.clientWidth}px`)
		document.body.classList.add('noscroll')
	}

	function enable() {
		document.body.classList.remove('noscroll')
		window.scrollTo({
			top: parseInt(document.body.style.getPropertyValue('--scroll-position')),
			left: 0,
			behavior: "auto"
		})
	}

	function toggle() {
		if (document.body.classList.contains('noscroll')) {
			enable()
		} else {
			disable()
		}
	}

	if (typeof action !== "undefined") {
		if (action) {
			enable()
		} else {
			disable()
		}
	} else {
		toggle()
	}
}

function ifClickInside(event: Event, targets: HTMLElement[]) {
	return targets.reduce(function (accumulator, currentValue) {
		return accumulator || event.composedPath().includes(currentValue)
	}, false)
}

export { toggleNoscrollBody, ifClickInside }
