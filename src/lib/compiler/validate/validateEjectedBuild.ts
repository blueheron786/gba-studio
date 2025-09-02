import { readFile, pathExists } from "fs-extra";
import Path from "path";
import l10n from "shared/lib/lang/l10n";

type ValidateOptions = {
  buildRoot: string;
  buildType?: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

export const validateEjectedBuild = async ({
  buildRoot,
  buildType = "gb",
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: ValidateOptions) => {
  progress(`${l10n("COMPILING_VALIDATING_BUILD_FILES")}...`);
  
  console.log(`[VALIDATE DEBUG] buildType: ${buildType}`);

  // Skip VM validation for GBA builds as they don't use the GBVM system
  if (buildType === "gba") {
    progress("Skipping VM validation for GBA build");
    console.log("[VALIDATE DEBUG] Skipping VM validation for GBA");
    return;
  }
  
  console.log("[VALIDATE DEBUG] Performing VM validation for Game Boy build");

  const vmIncludePath = Path.join(buildRoot, "include/vm.h");
  const gameGlobalsPath = Path.join(buildRoot, "include/data/game_globals.i");
  
  // Check if vm.h exists (it should for GB builds)
  if (!(await pathExists(vmIncludePath))) {
    warnings("VM header file (vm.h) not found. This may indicate an incomplete engine installation.");
    return;
  }

  const vmInclude = await readFile(vmIncludePath, "utf8");
  const gameGlobals = await readFile(gameGlobalsPath, "utf8");

  const vmHeapSizeStr = vmInclude.match(/#define VM_HEAP_SIZE (\d+)/m)?.[1];
  const maxGlobalVarsStr = gameGlobals.match(/MAX_GLOBAL_VARS = (\d+)/m)?.[1];

  const vmHeapSize = parseInt(vmHeapSizeStr ?? "", 10);
  const maxGlobalVars = parseInt(maxGlobalVarsStr ?? "", 10);

  if (isNaN(vmHeapSize) || isNaN(maxGlobalVars)) {
    warnings(
      "Unable to read VM_HEAP_SIZE and MAX_GLOBAL_VARS to determine if project contains too many unique variables",
    );
  }

  if (maxGlobalVars > vmHeapSize) {
    warnings(
      `Your project contains too many unique variables and will not work as expected. VM_HEAP_SIZE defines the maximum amount of variables allowed ${vmHeapSize} but your project contained ${maxGlobalVars} unique variables.`,
    );
  }
};
