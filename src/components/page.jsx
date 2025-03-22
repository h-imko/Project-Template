import Head from "./head"
import Footer from "./footer"
import Header from "./header"

export default function ({ children }) {
	return (
		<html lang="ru">
			<Head />
			<body>
				<Header />
				<main>
					{ children }
				</main>
				<Footer />
			</body>
		</html >
	)
}