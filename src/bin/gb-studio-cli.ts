import { copy, readFile, writeFile, readJSON, pathExists } from "fs-extra";
import Path from "path";
import os from "os";
import rimraf from "rimraf";
import { promisify } from "util";
import { program } from "commander";
import { binjgbRoot } from "consts";
import initElectronL10N from "lib/lang/initElectronL10N";
import loadProject from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";
import { buildRunner } from "lib/compiler/buildRunner";
import { BuildType } from "lib/compiler/buildWorker";
import { loadEngineSchema } from "lib/project/loadEngineSchema";
import { getROMFilename } from "shared/lib/helpers/filePaths";

const rmdir = promisify(rimraf);

declare const VERSION: string;

type Command = "export" | "make:rom" | "make:pocket" | "make:web" | "make:gba";

const buildTypeForCommand = (command: Command): BuildType => {
  if (command === "make:web") {
    return "web";
  }
  if (command === "make:pocket") {
    return "pocket";
  }
  if (command === "make:gba") {
    return "gba";
  }
  return "rom";
};

const main = async (
  command: Command,
  projectFile: string,
  destination: string,
) => {
  try {
    initElectronL10N();

    console.log(`[CLI DEBUG] Starting CLI with command: ${command}`);
    
    const buildType = buildTypeForCommand(command);
    console.log(`[CLI DEBUG] Build type: ${buildType}`);

    // Override the default engine path for GBA builds BEFORE loading anything
    if (buildType === "gba") {
      const consts = require("consts");
      console.log(`[CLI DEBUG] consts.enginesRoot: ${consts.enginesRoot}`);
      console.log(`[CLI DEBUG] Current __dirname: ${__dirname}`);
      
      // Fix the root directory calculation for CLI
      const currentDir = __dirname; // D:\code\gba-studio\out\cli
      const rootDir = currentDir.substring(0, currentDir.lastIndexOf("out\\cli"));
      const correctEnginesRoot = Path.join(rootDir, "appData", "engine");
      const gbaEnginePath = Path.join(correctEnginesRoot, "gbavm", "engine.json");
      
      console.log(`[CLI DEBUG] Fixed rootDir: ${rootDir}`);
      console.log(`[CLI DEBUG] Fixed enginesRoot: ${correctEnginesRoot}`);
      console.log(`[CLI DEBUG] GBA engine path: ${gbaEnginePath}`);
      
      // Override all paths
      const correctBuildToolsRoot = Path.join(rootDir, "buildTools");
      const correctBinjgbRoot = Path.join(rootDir, "appData", "wasm", "binjgb");
      
      (consts as any).enginesRoot = correctEnginesRoot;
      (consts as any).defaultEngineMetaPath = gbaEnginePath;
      (consts as any).defaultEngineRoot = Path.join(correctEnginesRoot, "gbavm");
      (consts as any).buildToolsRoot = correctBuildToolsRoot;
      (consts as any).binjgbRoot = correctBinjgbRoot;
      
      console.log(`[CLI DEBUG] Fixed buildToolsRoot: ${correctBuildToolsRoot}`);
    }

    // Load project file
    const projectRoot = Path.resolve(Path.dirname(projectFile));
    console.log(`[CLI DEBUG] Project root: ${projectRoot}`);
    
    const loadedProject = await loadProject(projectFile);
    console.log(`[CLI DEBUG] Project loaded successfully`);
    
    const project = decompressProjectResources(loadedProject.resources);
    console.log(`[CLI DEBUG] Project decompressed successfully`);

    // Load engine schema  
    const engineSchema = loadedProject.engineSchema;
    console.log(`[CLI DEBUG] Engine schema loaded successfully`);

    // Use OS default tmp
    const tmpPath = os.tmpdir();
    const tmpBuildDir = Path.join(tmpPath, "_gbsbuild");
    const outputRoot = tmpBuildDir;

    const progress = (message: string) => {
      if (program.verbose) {
        console.log(message);
      }
    };

    const warnings = (message: string) => {
      if (program.verbose) {
        console.warn(message);
      }
    };

  const colorOnly = project.settings.colorMode === "color";

  const romFilename = getROMFilename(
    project.settings.romFilename,
    project.metadata.name,
    colorOnly,
    buildType,
  );

  const { result } = buildRunner({
    project,
    buildType,
    projectRoot,
    engineSchema,
    tmpPath,
    outputRoot,
    romFilename,
    debugEnabled: project.settings.debuggerEnabled,
    make: command !== "export",
    progress,
    warnings,
  });

  await result;

  if (command === "export") {
    if (program.onlyData) {
      // Export src/data and include/data to destination
      const dataSrcTmpPath = Path.join(tmpBuildDir, "src", "data");
      const dataSrcOutPath = Path.join(destination, "src", "data");
      const dataIncludeTmpPath = Path.join(tmpBuildDir, "include", "data");
      const dataIncludeOutPath = Path.join(destination, "include", "data");
      await rmdir(dataSrcOutPath);
      await rmdir(dataIncludeOutPath);
      await copy(dataSrcTmpPath, dataSrcOutPath);
      await copy(dataIncludeTmpPath, dataIncludeOutPath);
    } else {
      // Export GBDK project to destination
      await copy(tmpBuildDir, destination);
    }
  } else if (command === "make:rom") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(romTmpPath, destination);
  } else if (command === "make:pocket") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(romTmpPath, destination);
  } else if (command === "make:gba") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(romTmpPath, destination);
  } else if (command === "make:web") {
    const romTmpPath = Path.join(tmpBuildDir, "build", "rom", romFilename);
    await copy(binjgbRoot, destination);
    await copy(romTmpPath, `${destination}/rom/${romFilename}`);
    const sanitize = (s: string) => String(s || "").replace(/["<>]/g, "");
    const projectName = sanitize(project.metadata.name);
    const author = sanitize(project.metadata.author);
    const colorsHead =
      project.settings.colorMode !== "mono"
        ? `<style type="text/css"> body { background-color:#${project.settings.customColorsBlack}; }</style>`
        : "";
    const customHead = project.settings.customHead || "";
    const customControls = JSON.stringify({
      up: project.settings.customControlsUp,
      down: project.settings.customControlsDown,
      left: project.settings.customControlsLeft,
      right: project.settings.customControlsRight,
      a: project.settings.customControlsA,
      b: project.settings.customControlsB,
      start: project.settings.customControlsStart,
      select: project.settings.customControlsSelect,
    });
    const html = (await readFile(`${destination}/index.html`, "utf8"))
      .replace(/___PROJECT_NAME___/g, projectName)
      .replace(/___AUTHOR___/g, author)
      .replace(/___COLORS_HEAD___/g, colorsHead)
      .replace(/___PROJECT_HEAD___/g, customHead)
      .replace(/___CUSTOM_CONTROLS___/g, customControls);

    const scriptJs = (
      await readFile(`${destination}/js/script.js`, "utf8")
    ).replace(/ROM_FILENAME = "[^"]*"/g, `ROM_FILENAME = "rom/${romFilename}"`);

    await writeFile(`${destination}/index.html`, html);
    await writeFile(`${destination}/js/script.js`, scriptJs);
  }
  } catch (error) {
    console.error('[CLI ERROR] Failed to execute command:', error);
    process.exit(1);
  }
};

program.version(VERSION);

program
  .command("export <projectFile> <destination>")
  .description("Export a project file to a GBDK project with engine and data")
  .action((source, destination) => {
    main("export", source, destination);
  });

program
  .command("make:rom <projectFile> <destination.gb>")
  .description("Build a ROM from project file")
  .action((source, destination) => {
    main("make:rom", source, destination);
  });

program
  .command("make:pocket <projectFile> <destination.pocket>")
  .description("Build a Pocket from project file")
  .action((source, destination) => {
    main("make:pocket", source, destination);
  });

program
  .command("make:gba <projectFile> <destination.gba>")
  .description("Build a GBA ROM from project file")
  .action((source, destination) => {
    main("make:gba", source, destination);
  });

program
  .command("make:web <projectFile> <destination>")
  .description("Build for web from project file")
  .action((source, destination) => {
    main("make:web", source, destination);
  });

program.option("-d, --onlyData", "Only replace data folder in destination");
program.option("-v, --verbose", "Verbose output");

program.parse(process.argv);
