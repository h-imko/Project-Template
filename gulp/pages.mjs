import Component from "./index.jsx"
import { renderToStaticMarkup } from 'react-dom/server'

Bun.write("./test.html", renderToStaticMarkup(Component({ message: 123 })))