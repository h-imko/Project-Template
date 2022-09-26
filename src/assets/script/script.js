let Cleave = require("cleave.js")
require('cleave.js/dist/addons/cleave-phone.ru')
require("fslightbox")
let InputContollerGroup = require("./_InputControllerGroup.ts").default
let Popup = require("./_Popup.ts").default
let Quantity = require("./_Quantity.ts").default
let Spoiler = require("./_Spoiler.ts").default

document.addEventListener('DOMContentLoaded', function () {
	// initPopups()
	// initTabs()
	// initPhoneMask()
	// initQuantity()
	// initSpoilers()
	// initInputControllerGroups()

})

window.addEventListener("load", function () {
	// headerHeightToCSS()
})

function initQuantity() {
	document.querySelectorAll(".quantity").forEach(item => {
		new Quantity(item)
	})
}

function initInputControllerGroups() {
	InputContollerGroup.findGroups().forEach(group => {
		new InputContollerGroup(group)
	})
}

function initPhoneMask() {
	document.querySelectorAll('input[type=tel]')
		.forEach(input => {
			new Cleave(input, {
				phone: true,
				phoneRegionCode: "RU",
				delimiter: "-",
				prefix: "+7",
				noImmediatePrefix: true
			})
		})
}

function headerHeightToCSS() {
	document.querySelector(':root')
		.style.setProperty('--header-height', `${document.querySelector('header').getBoundingClientRect().height}px`)
}

function initPopups() {
	window.popups = [...document.querySelectorAll("[data-popup]")].map(curr => new Popup(curr))
}

function initTabs() {
	let controls = document.querySelectorAll(".tabs__control input[type=radio]")

	function updateSlave(master, slave) {
		if (master.checked) {
			slave.checked = true
		}
	}

	controls.forEach(master => {
		let slave = document.querySelector(`#${master.dataset.target}`)

		updateSlave(master, slave)
		master.addEventListener("change", () => {
			updateSlave(master, slave)
		})
	})
}

function initSpoilers() {
	document.querySelectorAll('.spoiler')
		.forEach(spoiler => {
			new Spoiler(spoiler)
		})
}
