import glob from "glob";
import { promisify } from "util";
import { pathExists, readFile, writeFile } from "fs-extra";
import Path from "path";
import l10n from "shared/lib/lang/l10n";
import { getDevKitProPaths } from "lib/helpers/devkitpro";

const globAsync = promisify(glob);

type BuildOptions = {
  colorEnabled: boolean;
  sgb: boolean;
  musicDriver: string;
  debug: boolean;
  platform: string;
  batteryless: boolean;
  targetPlatform: "gb" | "pocket" | "gba";
  cartType: "mbc3" | "mbc5";
  compilerPreset: number;
};

export const getBuildCommands = async (
  buildRoot: string,
  {
    colorEnabled,
    sgb,
    musicDriver,
    debug,
    platform,
    batteryless,
    targetPlatform,
    cartType,
    compilerPreset,
  }: BuildOptions,
) => {
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  const output = [];

  // Check if building for GBA
  const isGBA = targetPlatform === "gba";
  
  let CC: string;
  if (isGBA) {
    // Use system devkitPro
    const devkitPaths = getDevKitProPaths();
    if (!devkitPaths.isValid) {
      throw new Error("devkitPro not found! Please install devkitPro and ensure DEVKITPRO/DEVKITARM environment variables are set.");
    }
    CC = devkitPaths.gccPath;
  } else {
    // Original GB build
    CC = platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc`
      : `../_gbstools/gbdk/bin/lcc`;
  }

  for (const file of buildFiles) {
    if (musicDriver === "huge" && file.indexOf("GBT_PLAYER") !== -1) {
      continue;
    }
    if (musicDriver !== "huge" && file.indexOf("HUGE_TRACKER") !== -1) {
      continue;
    }

    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    if (!(await pathExists(objFile))) {
      let buildArgs: string[];
      
      if (isGBA) {
        // GBA compilation flags
        buildArgs = [
          "-mthumb",
          "-mthumb-interwork", 
          "-mcpu=arm7tdmi",
          "-Wall",
          "-Wextra",
          "-O2",
          "-fomit-frame-pointer",
          "-Iinclude",
          "-c"
        ];
        
        if (debug) {
          buildArgs.push("-g");
          buildArgs.push("-DDEBUG");
        }
      } else {
        // Original GB compilation flags
        buildArgs = [
          `-Iinclude`,
          `-Wa-Iinclude`,
          `-Wa-I../_gbstools/gbdk/lib/small/asxxxx`,
          `-Wl-a`,
          `-Wf-MMD`,
          `-c`,
        ];

        buildArgs.push(`-Wf"--max-allocs-per-node ${compilerPreset ?? 3000}"`);

        if (colorEnabled) {
          buildArgs.push("-DCGB");
        }

        if (sgb) {
          buildArgs.push("-DSGB");
        }

        if (musicDriver === "huge") {
          buildArgs.push("-DHUGE_TRACKER");
        } else {
          buildArgs.push("-DGBT_PLAYER");
        }

        if (batteryless) {
          buildArgs.push("-DBATTERYLESS");
        }

        const rumbleBit = cartType === "mbc3" ? "0x20u" : "0x08u";
        buildArgs.push(`-DRUMBLE_ENABLE=${rumbleBit}`);

        if (debug) {
          buildArgs.push("-Wf--fverbose-asm");
          buildArgs.push("-Wf--debug");
          buildArgs.push("-Wl-m");
          buildArgs.push("-Wl-w");
          buildArgs.push("-Wl-y");
          buildArgs.push("-DVM_DEBUG_OUTPUT");
          buildArgs.push("-Wf--nolospre");
          buildArgs.push("-Wf--nogcse");
        }

        if (targetPlatform === "pocket") {
          buildArgs.push("-msm83:ap");
        }
      }

      buildArgs.push(
        "-o",
        Path.relative(buildRoot, objFile),
        Path.relative(buildRoot, file),
      );

      output.push({
        label: `${l10n("COMPILER_COMPILING")}: ${Path.relative(
          buildRoot,
          file,
        )}`,
        command: CC,
        args: buildArgs,
      });
    }
  }
  return output;
};

export const buildLinkFile = async (buildRoot: string) => {
  const output = [];
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  for (const file of buildFiles) {
    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    output.push(objFile);
  }
  return output.join("\n");
};

export const buildLinkFlags = (
  linkFile: string,
  romFilename: string,
  name = "GBSTUDIO",
  cartType: string,
  color = false,
  sgb = false,
  colorOnly = false,
  musicDriver = "gbtplayer",
  batteryless = false,
  debug = false,
  targetPlatform = "gb",
) => {
  const validName =
    name
      .toUpperCase()
      .replace(/[^A-Z]*/g, "")
      .substring(0, 15) || "GBSTUDIO";
      
  if (targetPlatform === "gba") {
    // GBA linking flags
    return [
      "-mthumb",
      "-mthumb-interwork",
      "-mcpu=arm7tdmi",
      "-T", "gba.ld",
      "-o", `build/rom/${romFilename}`,
      `-Wl,-Map,build/rom/game.map`,
      linkFile
    ];
  } else {
    // Original GB linking flags
    const cart = cartType === "mbc3" ? "0x10" : "0x1E";
    return ([] as Array<string>).concat(
      // General
      [
        // Cart
        `-Wm-yt${cart}`,
        // Banks
        "-autobank",
        "-Wb-ext=.rel",
        "-Wm-yoA",
        "-Wm-ya4",
        // Symbols
        "-Wl-j",
        "-Wl-m",
        "-Wl-w",
        "-Wm-yS",
        "-Wl-klib",
        "-Wl-g.STACK=0xDF00",
        "-Wi-e",
        `-Wm-yn"${validName}"`,
      ],
      // Color
      colorOnly ? ["-Wm-yC"] : color ? ["-Wm-yc"] : [],
      // SGB
      sgb ? ["-Wm-ys"] : [],
      // Pocket
      targetPlatform === "pocket" ? ["-msm83:ap"] : [],
      // Debug emulicious
      debug ? ["-Wf--debug", "-Wl-m", "-Wl-w", "-Wl-y"] : [],
      // Music Driver
      musicDriver === "huge"
        ? // hugetracker
          ["-Wl-lhUGEDriver.lib"]
        : // gbtplayer
          ["-Wl-lgbt_player.lib", "-Wb-reserve=1:800"],
      // Batteryless cart
      batteryless
        ? [
            "-Wb-reserve=15:4000",
            "-Wb-reserve=14:4000",
            "-Wb-reserve=13:4000",
            "-Wb-reserve=12:4000",
            "-Wl-g__start_save=12",
          ]
        : ["-Wl-g__start_save=0"],
      // Output
      ["-o", `"build/rom/${romFilename}"`],
      [`-Wl-f${linkFile}`],
    );
  }
};

export const makefileInjectToolsPath = async (
  filename: string,
  buildToolsPath: string,
) => {
  const makefile = await readFile(filename, "utf8");
  const updatedMakefile = makefile.replace(
    /GBSTOOLS_DIR =.*/,
    `GBSTOOLS_DIR = ${Path.normalize(buildToolsPath)}`,
  );
  await writeFile(filename, updatedMakefile);
};

export const buildMakeDotBuildFile = ({
  cartType = "mbc5",
  color = false,
  sgb = false,
  batteryless = false,
  musicDriver = "gbtplayer",
}) => {
  return (
    `settings: ` +
    ([] as Array<string>)
      .concat(
        color ? ["CGB"] : ["DMG"],
        sgb ? ["SGB"] : [],
        musicDriver === "huge" ? ["hUGE"] : ["GBT"],
        cartType === "mbc3" ? ["MBC3"] : ["MBC5"],
        batteryless ? ["batteryless"] : [],
      )
      .join(" ")
  );
};
