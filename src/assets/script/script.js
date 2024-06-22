// import Cleave from "cleave.js"
// import 'cleave.js/dist/addons/cleave-phone.ru'
// import "fslightbox"
// import { Splide } from "@splidejs/splide"
// import syncInputs from "./_syncedInputs.js"
// import { breakpoints, headerHeightToCSS } from "./_helpers"
// import counter from "./_counter.js"
// import dropzone from "./_Dropzone.js"
// import toggles from "./_toggles.js"

document.addEventListener('DOMContentLoaded', function () {
	// headerHeightToCSS()
	// cleave()
	// syncInputs()
	// counter()
	// dropzone()
	// toggles()
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
