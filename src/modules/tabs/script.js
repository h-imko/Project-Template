function initTabs() {
	document.querySelectorAll(".tabs")
		.forEach(tabgroup => {
			let controls = tabgroup.querySelectorAll(".tabs-control")
			let contents = Array.from(tabgroup.querySelectorAll(".tabs-content"))
			controls.forEach(control => {
				control.addEventListener("click", function () {
					contents.forEach(content => {
						content.classList.remove("active")
					})
					controls.forEach(control => {
						control.classList.remove("active")
					})
					contents.find(function (content) {
						return content.id == control.dataset.tabTarget
					})
						.classList.add("active")
					control.classList.add("active")
				})
			})
		})
}

export default initTabs