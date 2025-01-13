# sc-star-site

Static astro site to share literature survey qualitative coding results in the format output by [qdpx-to-json](https://github.com/keller-mark/qdpx-to-json).


```sh
rm -rf ./src/content/codes
rm -rf ./src/content/quotations
rm -rf ./src/content/sources
rm -rf ./src/content/code_groups
rm -rf ./src/content/source_groups

cp -r ../qdpx-to-json/data/out/content/codes ./src/content/codes
cp -r ../qdpx-to-json/data/out/content/quotations ./src/content/quotations
cp -r ../qdpx-to-json/data/out/content/sources ./src/content/sources
cp -r ../qdpx-to-json/data/out/content/code_groups ./src/content/code_groups
cp -r ../qdpx-to-json/data/out/content/source_groups ./src/content/source_groups

rm -rf ./src/images
cp -r ../qdpx-to-json/data/out/images ./src/images

pnpm run dev
```

Deployment

```sh
cd ../qdpx-to-json/data/out/content/ && zip -r ../../../../sc-star-site/content.zip . && cd -
# Upload the new content.zip to S3.
# May also need to sync ../qdpx-to-json/data/out/images with the S3 bucket's images/ directory.
```

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
