import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import "fslightbox"
import { Splide } from "@splidejs/splide"
import Dropzone from "./_Dropzone"
import InputContollerGroup from "./_InputControllerGroup"
import Popup from "./_Popup"
import Quantity from "./_Quantity"
import Spoiler from "./_Spoiler"
import Animate from "./_Animate"
import SyncedInputs from "./_SyncedInputs"
import { breakpoints } from "./_helpers"

document.addEventListener('DOMContentLoaded', function () {
	// initPopups()
	// initTabs()
	// initPhoneMask()
	// initQuantity()
	// initSpoilers()
	// initInputControllerGroups()
	// initSyncedInputs()
	// initDropzone()
	// initAnimates()
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

function initPopups() {
	window.popups = {};
	[...document.querySelectorAll("[data-popup]")].forEach(popup => {
		window.popups[popup.dataset.popup] = new Popup(popup)
	})
}

function initSpoilers() {
	document.querySelectorAll('.spoiler').forEach(spoiler => {
		new Spoiler(spoiler)
	})
}
