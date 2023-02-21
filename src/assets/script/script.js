import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import "fslightbox"
import Dropzone from "./_Dropzone"
import InputContollerGroup from "./_InputControllerGroup"
import Popup from "./_Popup"
import Quantity from "./_Quantity"
import Spoiler from "./_Spoiler"
import SyncedInputs from "./_SyncedInputs"

document.addEventListener('DOMContentLoaded', function () {
	// initPopups()
	// initTabs()
	// initPhoneMask()
	// initQuantity()
	// initSpoilers()
	// initInputControllerGroups()
	// initSyncedInputs()
})

window.addEventListener("load", function () {
	// headerHeightToCSS()
})

function initSyncedInputs() {
	SyncedInputs.findGroups().forEach(group => {
		new SyncedInputs(...group)
	})
}

function initDropzone() {
	document.querySelectorAll(".dropzone").forEach(item => {
		new Dropzone(item)
	})
}

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
	document.querySelectorAll('input[type=tel]').forEach(input => {
		new Cleave(input, {
			phone: true,
			phoneRegionCode: "RU",
			delimiter: "-",
			prefix: "+7",
			noImmediatePrefix: true
		})
	})
}

function initPopups() {
	window.popups = [...document.querySelectorAll("[data-popup]")].map(curr => new Popup(curr))
}

function initSpoilers() {
	document.querySelectorAll('.spoiler')
		.forEach(spoiler => {
			new Spoiler(spoiler)
		})
}
