// import Cleave from "cleave"
// import 'cleave/dist/addons/cleave-phone.ru'
// import "fslightbox"
// import { Splide } from "@splidejs/splide"
// import syncInputs from "./_syncedInputs"
// import { breakpoints, headerHeightToCSS } from "./_helpers"
// import counter from "./_counter"
// import dropzone from "./_Dropzone"
// import toggles from "./_toggles"
// import select from "./_select"

document.addEventListener('DOMContentLoaded', function () {
	// headerHeightToCSS()
	// cleave()
	// syncInputs()
	// counter()
	// dropzone()
	// toggles()
	// select()
})

function cleave() {
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
