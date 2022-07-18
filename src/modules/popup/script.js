function initPopups() {
	document.querySelectorAll("[data-popup]")
		.forEach(function (popup) {
			function makeClosePopup() {
				return function () {
					popup.blur()
				}
			}

			function makeOpenPopup() {
				return function () {
					popup.focus()
				}
			}
			window[`closePopup_${popup.id}`] = makeClosePopup()
			window[`openPopup_${popup.id}`] = makeOpenPopup()
			document.querySelectorAll(`.popup-opener[data-target="${popup.id}"]`)
				.forEach(function (opener) {
					opener.addEventListener('click', function () {
						popup.focus()
						event.preventDefault()
						event.stopPropagation()
					})
				})
			popup.querySelectorAll("input, textarea")
				.forEach(input => {
					input.addEventListener("focusout", () => {
						popup.focus()
					})
				})
			popup.addEventListener('click', function () {
				popup.blur()
			})
			popup.querySelector(".popup-inner")
				.addEventListener('click', function () {
					event.stopPropagation()
				})
			popup.addEventListener('focus', function () {
				if (!this.classList.contains('show')) {
					toggleNoscrollBody()
					this.classList.add("show")
				}
			})
			popup.addEventListener('focusout', function (event) {
				setTimeout(() => {
					if (!this.matches(":focus-within") && this.classList.contains('show')) {
						toggleNoscrollBody()
						this.classList.remove("show")
					}
				}, 100)
			})
			popup.querySelectorAll(".popup-closer")
				.forEach(closer => {
					closer.addEventListener("click", function () {
						popup.blur()
					})
				})
		})
}

export default initPopups