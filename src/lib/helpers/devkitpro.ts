import { existsSync } from "fs";
import { join } from "path";

export interface DevKitProPaths {
  devkitPro: string;
  devkitArm: string;
  gccPath: string;
  gbafixPath: string;
  isValid: boolean;
}

export function getDevKitProPaths(): DevKitProPaths {
  // Check environment variables first
  const devkitPro = process.env.DEVKITPRO;
  const devkitArm = process.env.DEVKITARM;
  
  if (devkitPro && devkitArm) {
    const gccPath = join(devkitArm, "bin", process.platform === "win32" ? "arm-none-eabi-gcc.exe" : "arm-none-eabi-gcc");
    const gbafixPath = join(devkitPro, "tools", "bin", process.platform === "win32" ? "gbafix.exe" : "gbafix");
    
    if (existsSync(gccPath)) {
      return {
        devkitPro,
        devkitArm,
        gccPath,
        gbafixPath,
        isValid: true
      };
    }
  }
  
  // Fallback: Try common installation paths
  const commonPaths = process.platform === "win32" 
    ? [
        "C:\\devkitPro",
        "D:\\devkitPro", 
        "C:\\Utils\\DevKitPro",
        "D:\\Utils\\DevKitPro"
      ]
    : [
        "/opt/devkitpro",
        "/usr/local/devkitpro"
      ];
  
  for (const basePath of commonPaths) {
    const armPath = join(basePath, "devkitARM");
    const gccPath = join(armPath, "bin", process.platform === "win32" ? "arm-none-eabi-gcc.exe" : "arm-none-eabi-gcc");
    const gbafixPath = join(basePath, "tools", "bin", process.platform === "win32" ? "gbafix.exe" : "gbafix");
    
    if (existsSync(gccPath)) {
      return {
        devkitPro: basePath,
        devkitArm: armPath,
        gccPath,
        gbafixPath,
        isValid: true
      };
    }
  }

  // Return invalid state
  return {
    devkitPro: "",
    devkitArm: "",
    gccPath: "",
    gbafixPath: "",
    isValid: false
  };
}

export function validateDevKitPro(): void {
  const paths = getDevKitProPaths();
  
  if (!paths.isValid) {
    throw new Error(
      "devkitPro not found! Please install devkitPro from https://devkitpro.org/wiki/Getting_Started\n" +
      "Make sure the DEVKITPRO and DEVKITARM environment variables are set correctly."
    );
  }
}
