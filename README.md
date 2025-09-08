# GBA Studio

- GBA Studio Copyright (c) 2025 Blue Heron, also released under the MIT license.
- GB Studio Copyright (c) 2024 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).
g/bxerKnc)

GBA Studio is an experimental fork of GBA Studio that's tailored for GBA game development. Like the original, GBA Studio aims to provide a quick and easy way to use retro adventure game creator for Game Boy Advance, available for Mac, Linux and Windows.

## ⚠️ Maintainers Wanted ⚠️

This project is a prototype. I'm not a JS/TS expert, nor a GBA ROM expert. If you can take over where I've left off, please let me know.

## Features

- Creates GBA projects instead of GB projects
- Exports .gba ROM files that run on Game Boy Advance
- Uses ARM-based compilation for enhanced performance
- Supports higher resolution graphics and more colors

It's a fully functional GB Studio look-alike that:

- Opens existing GB Studio projects and converts them to GBA format
- Provides the same visual editor interface
- Exports working .gba ROM files
- Runs the compiled games on GBA emulators or real hardware

For more information see the original [GBA Studio](https://www.gbstudio.dev) site.

![GBA Studio](gbstudio.gif)

GBA Studio consists of an [Electron](https://electronjs.org/) game builder application and a C based game engine using [GBDK](http://gbdk.sourceforge.net/).

## Installation

Download a release for your operating system from the [GBA Studio Downloads](https://www.gbstudio.dev/download) page.

Or to run from source, clone this repo then:

- Install [NodeJS](https://nodejs.org/) (required version is given in [.nvmrc](.nvmrc))

```bash
> cd gb-studio
> corepack enable
> yarn
> npm run fetch-deps
> npm start
```

After checking out a new version you may also need to fetch dependencies again to ensure you have the latest version of GBVM + GBDK etc.

```bash
> cd gb-studio
> npm run fetch-deps
```

GBA Studio currently uses Node 21.7.1. If you have [NVM](https://github.com/nvm-sh/nvm) installed you can use the included `.nvmrc` to switch to the supported Node version.

```bash
> cd gb-studio
> nvm use
```

## GBA Studio CLI

Install GBA Studio from source as above then

```bash
> npm run make:cli
> yarn link
# From any folder you can now run gb-studio-cli
> $(yarn bin gb-studio-cli) -V
4.1.2
> $(yarn bin gb-studio-cli) --help
```

### Update the CLI

Pull the latest code and run make:cli again, yarn link is only needed for the first run.

```bash
> npm run make:cli
```

### CLI Examples

- **Export Project**

  ```bash
  > $(yarn bin gb-studio-cli) export path/to/project.gbsproj out/
  ```

  Export GBDK project from gbsproj to out directory

- **Export Data**
  ```bash
  > $(yarn bin gb-studio-cli) export -d path/to/project.gbsproj out/
  ```
  Export only src/data and include/data from gbsproj to out directory
- **Make ROM**

  ```bash
  > $(yarn bin gb-studio-cli) make:rom path/to/project.gbsproj out/game.gb
  ```

  Make a ROM file from gbsproj

- **Make Pocket**

  ```bash
  > $(yarn bin gb-studio-cli) make:pocket path/to/project.gbsproj out/game.pocket
  ```

  Make a Pocket file from gbsproj

- **Make Web**
  ```bash
  > $(yarn bin gb-studio-cli) make:web path/to/project.gbsproj out/
  ```
  Make a Web build from gbsproj

## Documentation

[GB Studio Documentation](https://www.gbstudio.dev/docs)

## Note For Translators


If you're looking to update an existing translation with content that is missing, there is a handy script that lists keys found in the English localisation that are not found and copies them to your localisation

```bash
npm run missing-translations lang
# e.g. npm run missing-translations de
# e.g. npm run missing-translations en-GB
```
