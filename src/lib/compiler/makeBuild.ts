import fs from "fs-extra";
import os from "os";
import Path from "path";
import {
  buildLinkFile,
  buildLinkFlags,
  getBuildCommands,
} from "./buildMakeScript";
import { cacheObjData, fetchCachedObjData } from "./objCache";
import ensureBuildTools from "./ensureBuildTools";
import { getDevKitProPaths, validateDevKitPro } from "lib/helpers/devkitpro";
import spawn, { ChildProcess } from "lib/helpers/cli/spawn";
import l10n from "shared/lib/lang/l10n";
import { ProjectResources } from "shared/lib/resources/types";
import psTree from "ps-tree";
import { promisify } from "util";
import { envWith } from "lib/helpers/cli/env";

const psTreeAsync = promisify(psTree);

type MakeOptions = {
  buildRoot: string;
  romFilename: string;
  tmpPath: string;
  data: ProjectResources;
  buildType: "rom" | "web" | "pocket" | "gba";
  debug: boolean;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const cpuCount = os.cpus().length;
const childSet = new Set<ChildProcess>();
let cancelling = false;

const makeBuild = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  romFilename,
  data,
  debug = false,
  buildType = "gba", // Force GBA for now
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: MakeOptions) => {
  cancelling = false;
  const env = { ...process.env };
  const { settings } = data;
  const colorEnabled = settings.colorMode !== "mono";
  const sgbEnabled = settings.sgbEnabled && settings.colorMode !== "color";
  const colorOnly = settings.colorMode === "color";
  const targetPlatform = "gba"; // Force GBA for now
  const batterylessEnabled = settings.batterylessEnabled && buildType !== "web";

  const buildToolsPath = await ensureBuildTools(tmpPath);
  const buildToolsVersion = await fs.readFile(
    `${buildToolsPath}/tools_version`,
    "utf8",
  );

  // Check if we're building for GBA
  const isGBA = true; // For now, always use GBA
  
  if (isGBA) {
    // GBA build setup - use system devkitPro
    validateDevKitPro();
    const devkitPaths = getDevKitProPaths();
    
    env.PATH = envWith([Path.join(devkitPaths.devkitArm, "bin")]);
    env.DEVKITPRO = devkitPaths.devkitPro;
    env.DEVKITARM = devkitPaths.devkitArm;
    env.GBA_TOOLS_VERSION = buildToolsVersion;
    env.TARGET_PLATFORM = "gba";
  } else {
    // Original GB build setup
    env.PATH = envWith([Path.join(buildToolsPath, "gbdk", "bin")]);
    env.GBDKDIR = `${buildToolsPath}/gbdk/`;
    env.TARGET_PLATFORM = targetPlatform;
  }
  env.GBS_TOOLS_VERSION = buildToolsVersion;
  env.TARGET_PLATFORM = targetPlatform;

  env.CART_TYPE = settings.cartType || "mbc5";
  env.TMP = tmpPath;
  env.TEMP = tmpPath;
  if (colorEnabled) {
    env.COLOR = "true";
  }
  if (sgbEnabled) {
    env.SGB = "true";
  }
  if (batterylessEnabled) {
    env.BATTERYLESS = "true";
  }
  env.COLOR_MODE = settings.colorMode;
  env.MUSIC_DRIVER = settings.musicDriver;
  if (debug) {
    env.DEBUG = "true";
  }
  if (settings.musicDriver === "huge") {
    env.MUSIC_DRIVER = "HUGE_TRACKER";
  } else {
    env.MUSIC_DRIVER = "GBT_PLAYER";
  }
  if (settings.cartType === "mbc3") {
    env.RUMBLE_ENABLE = "0x20";
  } else {
    env.RUMBLE_ENABLE = "0x08";
  }

  env.GBDK_COMPILER_PRESET = String(settings.compilerPreset);

  // Populate /obj with cached data
  await fetchCachedObjData(buildRoot, tmpPath, env);

  // Compile Source Files
  const makeCommands = await getBuildCommands(buildRoot, {
    colorEnabled,
    sgb: sgbEnabled,
    musicDriver: settings.musicDriver,
    batteryless: batterylessEnabled,
    debug,
    platform: process.platform,
    targetPlatform,
    cartType: settings.cartType,
    compilerPreset: settings.compilerPreset,
  });

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  // Build source files in parallel
  const concurrency = cpuCount;
  await Promise.all(
    Array(concurrency)
      .fill(makeCommands.entries())
      .map(async (cursor) => {
        for (const [_, makeCommand] of cursor) {
          if (cancelling) {
            throw new Error("BUILD_CANCELLED");
          }
          try {
            progress(makeCommand.label);
          } catch (e) {
            throw e;
          }
          const { child, completed } = spawn(
            makeCommand.command,
            makeCommand.args,
            options,
            {
              onLog: (msg) => warnings(msg), // LCC writes errors to stdout
              onError: (msg) => warnings(msg),
            },
          );
          childSet.add(child);
          await completed;
          childSet.delete(child);
        }
      }),
  );

  // GBSPack ---

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  // Link ROM ---

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  progress(`${l10n("COMPILER_LINKING")}...`);
  
  let linkFilePath: string;
  let linkFile: string;
  
  if (isGBA) {
    // For GBA builds, we need to pass object files directly and use the GBA linker script
    linkFile = await buildLinkFile(buildRoot);
    linkFilePath = `${buildRoot}/obj/linkfile.lk`;
    await fs.writeFile(linkFilePath, linkFile);
  } else {
    // For Game Boy builds, use the traditional link file approach
    linkFile = await buildLinkFile(buildRoot);
    linkFilePath = `${buildRoot}/obj/linkfile.lk`;
    await fs.writeFile(linkFilePath, linkFile);
  }

  let linkCommand: string;
  if (isGBA) {
    const devkitPaths = getDevKitProPaths();
    linkCommand = devkitPaths.gccPath;
  } else {
    linkCommand = process.platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc.exe`
      : `../_gbstools/gbdk/bin/lcc`;
  }
  const linkArgs = buildLinkFlags(
    linkFilePath,
    romFilename,
    data.metadata.name || "GBStudio",
    settings.cartType,
    colorEnabled,
    sgbEnabled,
    colorOnly,
    settings.musicDriver,
    batterylessEnabled,
    debug,
    targetPlatform,
  );

  const { completed: linkCompleted, child } = spawn(
    linkCommand,
    linkArgs,
    options,
    {
      onLog: (msg) => progress(msg),
      onError: (msg) => {
        if (msg.indexOf("Converted build") > -1) {
          return;
        }
        warnings(msg);
      },
    },
  );

  childSet.add(child);
  await linkCompleted;
  childSet.delete(child);

  // Convert ELF to binary ROM (GBA only)
  if (isGBA) {
    progress("Converting ELF to binary ROM...");
    const devkitPaths = getDevKitProPaths();
    const elfPath = `${buildRoot}/build/rom/game.elf`;
    const romPath = `${buildRoot}/build/rom/${romFilename}`;
    
    if (devkitPaths.objcopyPath) {
      const { completed: objcopyCompleted, child: objcopyChild } = spawn(
        devkitPaths.objcopyPath,
        ["-O", "binary", elfPath, romPath],
        options,
        {
          onLog: (msg) => progress(msg),
          onError: (msg) => warnings(msg),
        },
      );
      
      childSet.add(objcopyChild);
      await objcopyCompleted;
      childSet.delete(objcopyChild);
      
      // Pad ROM to minimum size for emulator compatibility
      progress("Padding ROM to minimum size...");
      const romStat = await fs.stat(romPath);
      const minRomSize = 2 * 1024 * 1024; // 2MB minimum (required for mGBA compatibility)
      
      if (romStat.size < minRomSize) {
        const paddingSize = minRomSize - romStat.size;
        const padding = Buffer.alloc(paddingSize, 0xFF); // Fill with 0xFF (common for ROM padding)
        await fs.appendFile(romPath, padding);
        progress(`Padded ROM from ${romStat.size} to ${minRomSize} bytes`);
      }
    } else {
      warnings("objcopy not found in devkitARM toolchain");
    }
  }

  // Fix GBA ROM header (GBA only)
  if (isGBA) {
    progress("Fixing GBA ROM header...");
    const devkitPaths = getDevKitProPaths();
    const romPath = `${buildRoot}/build/rom/${romFilename}`;
    
    if (devkitPaths.gbafixPath) {
      const { completed: gbafixCompleted, child: gbafixChild } = spawn(
        devkitPaths.gbafixPath,
        [romPath],
        options,
        {
          onLog: (msg) => progress(msg),
          onError: (msg) => warnings(msg),
        },
      );
      
      childSet.add(gbafixChild);
      await gbafixCompleted;
      childSet.delete(gbafixChild);
    }
  }

  // Export game globals to ROM directory (Game Boy only)
  if (targetPlatform !== "gba") {
    const gameGlobalsPath = `${buildRoot}/include/data/game_globals.i`;
    const gameGlobalsExportPath = `${buildRoot}/build/rom/globals.i`;
    await fs.copyFile(gameGlobalsPath, gameGlobalsExportPath);
  }

  // Store /obj in cache
  await cacheObjData(buildRoot, tmpPath, env);
};

export const cancelBuildCommandsInProgress = async () => {
  cancelling = true;
  // Kill all spawned commands and any commands that were spawned by those
  // e.g lcc spawns sdcc, etc.
  for (const child of childSet) {
    if (child.pid === undefined) {
      continue;
    }
    const spawnedChildren = await psTreeAsync(child.pid);
    for (const childChild of spawnedChildren) {
      try {
        process.kill(Number(childChild.PID));
      } catch (e) {}
    }
    try {
      child.kill();
    } catch (e) {}
  }
};

export default makeBuild;
