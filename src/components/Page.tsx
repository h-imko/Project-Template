import Footer from "./Footer"
import Head from "./Head"
import Header from "./Header"

export default function ({ children }: { children: React.ReactNode }) {
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