var bun = require("bun");

var builtinModules = Array.from((new bun.Glob("./lib/**/*")).scanSync("."));

async function build(platform, arch, cpuType, clib) {
  await Bun.build({
    "entrypoints": ["./bootstrap.js", ...builtinModules],
    "compile": {
      "outfile": `./dist/rare-${platform.toLowerCase()}-${arch.toLowerCase()}${arch == "x64" ? `-${cpuType}` : ""}${platform.toLowerCase() == "linux" ? `-${clib.toLowerCase()}` : ""}`,
      "target": `bun-${platform.toLowerCase() == "macos" ? "darwin" : platform.toLowerCase()}-${arch.toLowerCase()}${arch == "x64" ? `-${cpuType}` : ""}${platform.toLowerCase() == "linux" && clib.toLowerCase() != "glibc" ? `-${clib.toLowerCase()}` : ""}`,
      "windows": (platform.toLowerCase() == "windows" ? {
        "icon": "./rarescript.ico",
        "title": "RareScript",
        "publisher": "RareScript",
        "version": (process.env.RARE_VERSION ? process.env.RARE_VERSION.slice(1) : "0.0.0"),
        "description": "RareScript CLI",
        "copyright": `Copyright ${(new Date).getFullYear()}`,
      } : undefined)
    },
    "minify": true,
    "bytecode": true,
    "naming": {
      "asset": "[name].[ext]"
    },
    "define": {
      "RARE_BUILD": "true",
      "RARE_VERSION": (process.env.RARE_VERSION || "DEV")
    }
  });
  console.log(`\x1b[32m✅ Compiled for ${platform} (${arch}${arch == "x64" ? `, ${cpuType}` : ""})${platform.toLowerCase() == "linux" ? ` with ${clib}` : ""}.\x1b[0m`);
}

(async () => {
  for (var platform of ["Windows", "Linux", "macOS"]) {
    for (var arch of ["x64", "ARM64"]) {
      if (platform == "Windows" && arch == "ARM64") {
        continue;
      }
      for (var cpuType of ["baseline", "modern"]) {
        if (arch == "ARM64" && cpuType == "modern") {
          continue;
        }
        for (var clib of ["GLibC", "Musl"]) {
          if (platform != "Linux" && clib == "Musl") {
            continue;
          }
          await build(platform, arch, cpuType, clib);
        }
      }
    }
  }
})();