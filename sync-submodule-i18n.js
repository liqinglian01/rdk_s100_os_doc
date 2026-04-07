/**
 * 为何需要「根目录带插件 id 前缀」？
 * @docusaurus/plugin-content-docs 在「非 default 插件 id」时，版本路径写死在 site 根目录：
 *   ${pluginId}_versions.json、${pluginId}_versioned_docs/、${pluginId}_versioned_sidebars/
 * 见 node_modules/@docusaurus/plugin-content-docs/lib/versions/files.js 的 addPluginIdPrefix。
 * 官方选项里不能改成「只在 rdk_s100_robot_development_doc/ 里找 rdk_s100_robot_development_doc_versions.json」。
 *
 * 因此主站必须在站点根目录出现上述名字；实现方式二选一：
 *   - 默认：复制 submodule 内文件（最稳，CI/无管理员权限友好）
 *   - 可选：设置环境变量 SUBMODULE_SYNC_SYMLINK=1，用符号链接/目录联接指向子目录（不复制内容，需本机支持 symlink/junction）
 *
 * 另：i18n 同步为 docusaurus-plugin-content-docs-<pluginId>，同上。
 *
 * 仓库体积：上述根目录产物与 submodule 内数据重复，已在 .gitignore 中排除，勿提交。
 * 主仓库只保留 submodule 指针；构建前由本脚本（postinstall / prebuild 等）生成根目录文件即可。
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOCALES = ["en", "zh-Hans"];

const USE_SYMLINK =
  process.env.SUBMODULE_SYNC_SYMLINK === "1" ||
  process.env.SUBMODULE_SYNC_SYMLINK === "true";

/** 子目录名（与 git submodule path 一致）→ 主站 @docusaurus/plugin-content-docs 的 id */
const SUBMODULES = [
  { pluginId: "rdk_s100_algorithm_application_doc", subDir: "rdk_s100_algorithm_application_doc" },
  { pluginId: "rdk_s100_robot_development_doc", subDir: "rdk_s100_robot_development_doc" },
];

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* 短延迟，缓解 Windows 上文件仍被占用时的 EPERM */
  }
}

function rmDestRecursive(dest) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      return;
    } catch (e) {
      if (attempt === 2) {
        throw e;
      }
      sleepMs(400);
    }
  }
}

/**
 * @param {"file"|"dir"} kind
 */
function linkOrCopy(src, dest, logLabel, kind) {
  rmDestRecursive(dest);
  if (USE_SYMLINK) {
    try {
      const abs = path.resolve(src);
      if (kind === "file") {
        fs.symlinkSync(abs, dest, "file");
      } else if (process.platform === "win32") {
        fs.symlinkSync(abs, dest, "junction");
      } else {
        fs.symlinkSync(abs, dest, "dir");
      }
      console.log(`[sync-submodules] ${logLabel} -> ${path.relative(ROOT, dest)} (symlink)`);
      return;
    } catch (e) {
      console.warn(
        `[sync-submodules] symlink failed (${e.message}), fallback to copy: ${logLabel}`,
      );
    }
  }
  if (kind === "file") {
    fs.copyFileSync(src, dest);
  } else {
    fs.cpSync(src, dest, { recursive: true, force: true });
  }
  console.log(`[sync-submodules] ${logLabel} -> ${path.relative(ROOT, dest)} (copy)`);
}

function syncPluginVersionArtifacts(pluginId, subDir) {
  const subRoot = path.join(ROOT, subDir);
  if (!fs.existsSync(subRoot)) {
    console.warn(
      `[sync-submodules] ${pluginId}: path missing (${subDir}), skip version artifacts.`,
    );
    return;
  }
  const srcVersions = path.join(subRoot, "versions.json");
  if (!fs.existsSync(srcVersions)) {
    console.warn(
      `[sync-submodules] ${pluginId}: no versions.json in submodule, skip version artifacts.`,
    );
    return;
  }
  const destVersions = path.join(ROOT, `${pluginId}_versions.json`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      linkOrCopy(
        srcVersions,
        destVersions,
        `${pluginId} versions.json`,
        "file",
      );
      break;
    } catch (e) {
      if (attempt === 2) {
        throw e;
      }
      sleepMs(400);
    }
  }

  const srcVd = path.join(subRoot, "versioned_docs");
  const destVd = path.join(ROOT, `${pluginId}_versioned_docs`);
  if (fs.existsSync(srcVd)) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        linkOrCopy(srcVd, destVd, `${pluginId} versioned_docs`, "dir");
        break;
      } catch (e) {
        if (attempt === 2) {
          throw e;
        }
        sleepMs(400);
      }
    }
  } else {
    console.warn(
      `[sync-submodules] ${pluginId}: no versioned_docs in submodule.`,
    );
  }

  const srcVs = path.join(subRoot, "versioned_sidebars");
  const destVs = path.join(ROOT, `${pluginId}_versioned_sidebars`);
  if (fs.existsSync(srcVs)) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        linkOrCopy(srcVs, destVs, `${pluginId} versioned_sidebars`, "dir");
        break;
      } catch (e) {
        if (attempt === 2) {
          throw e;
        }
        sleepMs(400);
      }
    }
  } else {
    console.warn(
      `[sync-submodules] ${pluginId}: no versioned_sidebars in submodule.`,
    );
  }
}

function syncPluginLocale(pluginId, subDir, locale) {
  const src = path.join(
    ROOT,
    subDir,
    "i18n",
    locale,
    "docusaurus-plugin-content-docs",
  );
  const dest = path.join(
    ROOT,
    "i18n",
    locale,
    `docusaurus-plugin-content-docs-${pluginId}`,
  );

  if (!fs.existsSync(src)) {
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      linkOrCopy(src, dest, `${pluginId} i18n ${locale}`, "dir");
      return true;
    } catch (e) {
      if (attempt === 2) {
        throw e;
      }
      sleepMs(400);
    }
  }
  return false;
}

if (USE_SYMLINK) {
  console.log(
    "[sync-submodules] SUBMODULE_SYNC_SYMLINK=1: using symlinks/junctions where possible",
  );
}

for (const { pluginId, subDir } of SUBMODULES) {
  syncPluginVersionArtifacts(pluginId, subDir);
}

let anyI18n = false;
for (const { pluginId, subDir } of SUBMODULES) {
  const subRoot = path.join(ROOT, subDir);
  if (!fs.existsSync(subRoot)) {
    console.warn(
      `[sync-submodules] ${pluginId}: path missing (${subDir}), skip i18n.`,
    );
    continue;
  }
  for (const locale of LOCALES) {
    if (syncPluginLocale(pluginId, subDir, locale)) {
      anyI18n = true;
    }
  }
}

if (!anyI18n) {
  console.warn(
    "[sync-submodules] No submodule i18n/docusaurus-plugin-content-docs found — submodules not initialized?",
  );
}
