# Структура проекта
-  `build` готовая сборка
-  `gulp` части скрипта сборки
-  `node_modules` пакеты
-  `src` исхдные файлы проекта
   -  `assets`
      - `script` скрипты
         -  `**/_*.js` несобираемые скрипты (для импорта в собираемые)
         -  `**/*.js` собираемые файлы скриптов, будут в билде 1 к 1
      -  `static` копируется в build как есть
         -  `font/**/*` шрифты
         - ` img/**/*`- картинки ужатые (только для чтения)
         -  `img-raw/**/*` картинки сырые
            -  `icon/**/*` иконки которые будут собраны в спрайт
         -  что угодно еще
      -  `styles` стили
         - ` **/ _*.scss` несобираемые стили (для импорта в собираемые)
         -  `**/*.scss` собираемые файлы стилей, будут в билде 1 к 1
      -  `components/**/*.jsx` jsx-компоненты из которых собираются страницы
   - `**/*.jsx` самостоятельные страницы
-  `package.json` информация о проекте
   - `dependences` список установленных пакетов
   - `scripts` готовые скрипты сборки
      - `dev` скрипт для разработки, файлы собираются в оперативу, поднимает локальный сервер и автоматически обновляет на нем измененные файлы
      - `build` скрипт для сборки в `./build` без минификации
      - `build_min` с минификацией
      - `build_watch` с локальным сервером
      - `build_watch_min` с локальным сервером и с минификацией
      - `imagemin` сжимает картинки, автоматически происходит во всех скриптах сборки, вынесен для особых случаев
      - `ttfToWoff` перекомпиливает шрифты в woff2
      - `init` подготавливает проект к работе, должен быть запущен в первую очередь один раз
-  `gulpfile.mjs` скрипт сборки
- Для работы сборки требуется node.js, все скрипты пинаются из корня проекта при помощи `"npm run %script%"`

# JSX
Испоьзуется в качестве шаблонизатора статических страниц

Специфично для этой сборки каждая страница должна иметь функцию `index` в качестве экспорта по умолчанию (смотри пример в `src/index.jsx`)

Доку по языку читай на [доке реакта](https://react.dev/learn/writing-markup-with-jsx)