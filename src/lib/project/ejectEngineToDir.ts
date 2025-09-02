import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import { defaultEngineMetaPath, defaultEngineRoot } from "consts";
import copy from "lib/helpers/fsCopy";

const rmdir = promisify(rimraf);

const ejectEngineToDir = async (ejectPath: string) => {
  const engineSrcPath = `${defaultEngineRoot}/src`;
  const engineIncludePath = `${defaultEngineRoot}/include`;
  const engineGBALinkerPath = `${defaultEngineRoot}/gba.ld`;
  const engineMakefilePath = `${defaultEngineRoot}/Makefile`;
  const ejectSrcPath = `${ejectPath}/src`;
  const ejectIncludePath = `${ejectPath}/include`;
  const ejectMetaPath = `${ejectPath}/engine.json`;
  const ejectGBALinkerPath = `${ejectPath}/gba.ld`;
  const ejectMakefilePath = `${ejectPath}/Makefile`;

  await rmdir(ejectPath);

  await fs.ensureDir(ejectPath);
  await fs.ensureDir(ejectSrcPath);
  await fs.ensureDir(ejectIncludePath);

  await copy(engineSrcPath, ejectSrcPath);
  await copy(engineIncludePath, ejectIncludePath);
  console.log("COPY", { defaultEngineMetaPath, ejectMetaPath });
  await copy(defaultEngineMetaPath, ejectMetaPath);
  
  // Copy GBA-specific files
  if (await fs.pathExists(engineGBALinkerPath)) {
    await copy(engineGBALinkerPath, ejectGBALinkerPath);
  }
  if (await fs.pathExists(engineMakefilePath)) {
    await copy(engineMakefilePath, ejectMakefilePath);
  }
};

export default ejectEngineToDir;
