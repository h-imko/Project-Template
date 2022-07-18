function initSpoilers() {
	document.querySelectorAll('.spoiler')
		.forEach(spoiler => {
			let slideToggle = makeSlideToggle(spoiler.querySelector(".spoiler-content"))
			spoiler.querySelector('.spoiler-toggler')
				.addEventListener('click', function () {
					spoiler.classList.toggle("spoiler-opened")
					slideToggle()
				})
			if (spoiler.dataset.spoilerDefaultOpened) {
				slideToggle()
			}
		})
}

function makeSlideToggle(elem) {
	let initialHeight = getComputedStyle(elem)
		.maxHeight
	return function () {
		if (event) {
			event.preventDefault()
		}
		if (elem.style.maxHeight == "") {
			elem.focus()
			elem.style.maxHeight = `${elem.scrollHeight}px`
		} else if (elem.style.maxHeight != initialHeight) {
			elem.blur()
			elem.style.maxHeight = initialHeight
		} else {
			elem.focus()
			elem.style.maxHeight = `${elem.scrollHeight}px`
		}
	}
}

export default initSpoilers