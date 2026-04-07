
import { themes as prismThemes } from "prism-react-renderer";
import fs from "fs";
import path from "path";

/**
 * 📦 读取 versions.json（兼容首次无文件）
 */
let publishedVersions = [];

try {
  const file = path.resolve("./versions.json");
  if (fs.existsSync(file)) {
    publishedVersions = JSON.parse(fs.readFileSync(file, "utf-8"));
  }
} catch (e) {}

/**
 * 📦 rdk_s100_algorithm_application_doc 版本列表：优先读同步脚本生成的根目录文件（与 Docusaurus 多实例插件 id 一致），
 * 否则读子仓库 rdk_s100_algorithm_application_doc/versions.json（未跑 sync 时兜底）
 */
let algorithmPublishedVersions = [];

try {
  const rootAlgo = path.resolve("./rdk_s100_algorithm_application_doc_versions.json");
  const subAlgo = path.resolve("./rdk_s100_algorithm_application_doc/versions.json");
  if (fs.existsSync(rootAlgo)) {
    algorithmPublishedVersions = JSON.parse(fs.readFileSync(rootAlgo, "utf-8"));
  } else if (fs.existsSync(subAlgo)) {
    algorithmPublishedVersions = JSON.parse(fs.readFileSync(subAlgo, "utf-8"));
  }
} catch (e) {}

/**
 * 📦 rdk_s100_robot_development_doc 版本列表：根目录 rdk_s100_robot_development_doc_versions.json（由 sync 从子仓库拷贝），否则读子仓库内文件
 */
let robotPublishedVersions = [];

try {
  const rootRobot = path.resolve("./rdk_s100_robot_development_doc_versions.json");
  const subRobot = path.resolve("./rdk_s100_robot_development_doc/versions.json");
  if (fs.existsSync(rootRobot)) {
    robotPublishedVersions = JSON.parse(fs.readFileSync(rootRobot, "utf-8"));
  } else if (fs.existsSync(subRobot)) {
    robotPublishedVersions = JSON.parse(fs.readFileSync(subRobot, "utf-8"));
  }
} catch (e) {}

/** 有已发布快照时：根路径为最新发布版；未发布文档在 /next。无发布记录时仍只有 current 占根路径。 */
const docsVersions =
  publishedVersions.length > 0
    ? (() => {
        const latestPub = publishedVersions[0];
        const map = {
          current: {
            label: "Next",
            path: "next",
            banner: "none",
          },
        };
        for (const v of publishedVersions) {
          map[v] = {
            label: `V${v}`,
            path: v === latestPub ? "" : v,
            banner: v === latestPub ? "none" : "unmaintained",
          };
        }
        return map;
      })()
    : {
        current: {
          label: "Next",
          path: "",
          banner: "none",
        },
      };

/** Model Zoo（rdk_s100_algorithm_application_doc）版本路由与标签，与主站 docsVersions 规则一致 */
const algorithmDocsVersions =
  algorithmPublishedVersions.length > 0
    ? (() => {
        const latestPub = algorithmPublishedVersions[0];
        const map = {
          current: {
            label: "Next",
            path: "next",
            banner: "none",
          },
        };
        for (const v of algorithmPublishedVersions) {
          map[v] = {
            label: `V${v}`,
            path: v === latestPub ? "" : v,
            banner: v === latestPub ? "none" : "unmaintained",
          };
        }
        return map;
      })()
    : {
        current: {
          label: "Next",
          path: "",
          banner: "none",
        },
      };

/** TogetherROS.Bot（rdk_s100_robot_development_doc）版本路由，与主站 / Model Zoo 规则一致 */
const robotDocsVersions =
  robotPublishedVersions.length > 0
    ? (() => {
        const latestPub = robotPublishedVersions[0];
        const map = {
          current: {
            label: "Next",
            path: "next",
            banner: "none",
          },
        };
        for (const v of robotPublishedVersions) {
          map[v] = {
            label: `V${v}`,
            path: v === latestPub ? "" : v,
            banner: v === latestPub ? "none" : "unmaintained",
          };
        }
        return map;
      })()
    : {
        current: {
          label: "Next",
          path: "",
          banner: "none",
        },
      };

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "RDK X3 DOC",
  favicon: "img/logo.png",

  url: "https://developer.d-robotics.cc",
  baseUrl: "/rdk_s100_os_doc/",

  organizationName: "D-Robotics",
  projectName: "rdk_s100_os_doc",

  customFields: {
    docsInstanceDisplayNames: {
      default: "RDK S100 OS",
      rdk_s100_algorithm_application_doc: "Model Zoo",
      rdk_s100_robot_development_doc: "TogetheROS.Bot",
    },
  },

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  scripts: [
    {
      src: "https://hm.baidu.com/hm.js?24dd63cad43b63889ea6bede5fd1ab9e",
      async: true,
    },
    // Dify Chatbot Configuration
    {
      src: "/rdk_s100_os_doc/js/dify-config.js",
    },
    {
      src: "https://rdk.d-robotics.cc/embed.min.js",
      id: "MltLQTHPb5EeP7uz",
      defer: true,
    },
  ],
  
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans", "en"],
    localeConfigs: {
      en: { label: "EN" },
      "zh-Hans": { label: "CN" },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // ✅ 必须（否则默认不显示文档）

          sidebarPath: require.resolve("./sidebars.js"),
          showLastUpdateTime: true,

          includeCurrentVersion: true,

          lastVersion:
            publishedVersions.length > 0 ? publishedVersions[0] : "current",

          versions: docsVersions,
        },

        blog: { showReadingTime: true },
        pages: { exclude: ["/imager/**", "**/dl/**"] },
        theme: { customCss: "./src/css/custom.css" },
        sitemap: { lastmod: "date" },
      },
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "rdk_s100_robot_development_doc",
        path: "rdk_s100_robot_development_doc/docs",
        routeBasePath: "rdk_s100_robot_development_doc",
        sidebarPath: require.resolve('./sidebars.js'),
        showLastUpdateTime: true,
        includeCurrentVersion: true,
        lastVersion:
          robotPublishedVersions.length > 0
            ? robotPublishedVersions[0]
            : "current",
        versions: robotDocsVersions,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "rdk_s100_algorithm_application_doc",
        path: "rdk_s100_algorithm_application_doc/docs",
        routeBasePath: "rdk_s100_algorithm_application_doc",
        sidebarPath: require.resolve("./rdk_s100_algorithm_application_doc/sidebars.js"),
        showLastUpdateTime: true,
        includeCurrentVersion: true,
        lastVersion:
          algorithmPublishedVersions.length > 0
            ? algorithmPublishedVersions[0]
            : "current",
        versions: algorithmDocsVersions,
      },
    ],
  ],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 5,
    },

    navbar: {
      title: "D-Robotics",
      logo: {
        alt: "logo",
        src: "img/logo.png",
        href: "https://d-robotics.cc/",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "RDK S100 OS",
        },
        {
          type: "docsVersionDropdown",
          position: "left",
          // 仅列出已发布快照；未发布为 /next，不进下拉
          ...(publishedVersions.length > 0 ? { versions: publishedVersions } : {}),
        },
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Model Zoo",
          docsPluginId: "rdk_s100_algorithm_application_doc",
        },
        {
          type: "docsVersionDropdown",
          docsPluginId: "rdk_s100_algorithm_application_doc",
          position: "left",
          ...(algorithmPublishedVersions.length > 0
            ? {versions: algorithmPublishedVersions}
            : {}),
        },

        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "TogetheROS.Bot",
          docsPluginId: "rdk_s100_robot_development_doc",
        },
        {
          type: "docsVersionDropdown",
          docsPluginId: "rdk_s100_robot_development_doc",
          position: "left",
          ...(robotPublishedVersions.length > 0
            ? { versions: robotPublishedVersions }
            : {}),
        },
        {
          href: "https://developer.d-robotics.cc/",
          label: "Community",
          position: "right",
        },
        {
          href: "https://github.com/D-Robotics",
          label: "GitHub",
          position: "right",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "友情链接",
          items: [
            {
              label: "古月居",
              href: "https://www.guyuehome.com/",
            },
          ],
        },
        {
          title: "联系我们",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/D-Robotics",
            },
            {
              label: "BiLiBiLi",
              href: (() => {
                if (process.env.DOCUSAURUS_CURRENT_LOCALE === "en") {
                  return "https://www.youtube.com/@D-Robotics";
                }
                return "https://space.bilibili.com/437998606";
              })(),
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} D-Robotics.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },

  themes: [
    "@docusaurus/theme-mermaid",
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["en", "zh"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: [
          "/",
          "rdk_s",
          "rdk_s100_robot_development_doc",
          "rdk_s100_algorithm_application_doc",
        ],

        indexDocs: true,
        indexBlog: false,
        indexPages: false,

        searchResultContextMaxLength: 50,
      },
    ],
  ],
};

export default config;