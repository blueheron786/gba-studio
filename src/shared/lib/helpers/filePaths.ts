import stripInvalidFilenameCharacters from "./stripInvalidFilenameCharacters";

export const getROMFileStem = (
  overrideName: string,
  projectName: string,
): string => {
  const source =
    stripInvalidFilenameCharacters(overrideName).trim().length > 0
      ? overrideName
      : kebabCase(projectName.trim());

  const stem = stripInvalidFilenameCharacters(source)
    .replace(/(\.gb|\.gbc|\.pocket|\.gba)$/i, "")
    .trim();

  if (stem.replace(/-/g, "").length === 0) {
    return "game";
  }

  return stem;
};

export const getROMFilename = (
  overrideName: string,
  projectName: string,
  isColorOnly: boolean,
  buildType: "rom" | "pocket" | "web" | "gba",
): string => {
  const fileExt = buildType === "gba" ? "gba"
    : buildType === "pocket" ? "pocket" 
    : isColorOnly ? "gbc" 
    : "gb";
  const fileStem = getROMFileStem(overrideName, projectName);
  return `${fileStem}.${fileExt}`;
};

export const kebabCase = (string: string): string =>
  string.toLocaleLowerCase().replace(/[ ]+/g, "-");
