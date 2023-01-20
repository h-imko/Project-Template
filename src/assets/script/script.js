import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import "fslightbox"
import InputContollerGroup from "./_InputControllerGroup"
import Popup from "./_Popup"
import Quantity from "./_Quantity"
import Spoiler from "./_Spoiler"

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
