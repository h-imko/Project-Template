import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import "fslightbox"
import { Splide } from "@splidejs/splide"
import Dropzone from "./_Dropzone"
import InputContollerGroup from "./_InputControllerGroup"
import Popup from "./_Popup"
import Quantity from "./_Quantity"
import Animate from "./_Animate"
import SyncedInputs from "./_SyncedInputs"
import { breakpoints, headerHeightToCSS } from "./_helpers"

document.addEventListener('DOMContentLoaded', function () {
	// headerHeightToCSS()
	// Popup.initPopups()
	// initTabs()
	// initPhoneMask()
	// initQuantity()
	// initInputControllerGroups()
	// initSyncedInputs()
	// initDropzone()
	// initAnimates()
})

function initSyncedInputs() {
	SyncedInputs.findGroups().forEach(group => {
		new SyncedInputs(...group)
	})
}

function initDropzone() {
	window.dropzones = []
	document.querySelectorAll(".dropzone").forEach(dropzone => {
		new Dropzone(dropzone)
	})
}

function initAnimates() {
	window.animates = [...document.querySelectorAll("[data-animate-group]")].map(group => new Animate(group))
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
