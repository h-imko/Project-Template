import "fslightbox"
document.addEventListener('DOMContentLoaded', function () { })

function calcTopForSticky() {
	document.querySelectorAll('[data-sticky]')
		.forEach(sticky => {
			let stickyOffset = sticky.getBoundingClientRect()[sticky.dataset.sticky]
			let minimumOffset = parseInt(document.querySelector(':root')
				.style.getPropertyValue('--header-height')) + 24

			if (minimumOffset && stickyOffset < minimumOffset) stickyOffset = minimumOffset

			sticky.style.setProperty(sticky.dataset.sticky, `${stickyOffset}px`)
		})
}

function toggleNoscrollBody() {
	if (document.body.classList.contains('noscroll')) {
		document.body.classList.remove('noscroll')
		window.scrollTo({
			top: document.body.style.getPropertyValue('--scroll-position')
				.replace('px', ""),
			left: 0,
			behavior: "instant"
		})
	} else {
		document.body.style.setProperty("--scroll-position", `${window.pageYOffset}px`)
		document.body.style.setProperty("--scrollbar-width", `${window.innerWidth - document.documentElement.clientWidth}px`)
		document.body.classList.add('noscroll')
	}
}