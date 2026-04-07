/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Swizzled: prefix version label with "版本：" / "Version: " by locale.
 */

import React, {useMemo, type ReactNode} from 'react';
import {
  useVersions,
  useActiveDocContext,
  useDocsPreferredVersion,
  useLatestVersion,
} from '@docusaurus/plugin-content-docs/client';
import {uniq} from '@docusaurus/theme-common';
import {translate} from '@docusaurus/Translate';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type {
  Props,
  PropVersions,
  PropVersionItem,
} from '@theme/NavbarItem/DocsVersionDropdownNavbarItem';
import type {LinkLikeNavbarItemProps} from '@theme/NavbarItem';
import type {
  GlobalVersion,
  GlobalDoc,
  ActiveDocContext,
} from '@docusaurus/plugin-content-docs/client';

type VersionItem = {
  version: GlobalVersion;
  label: string;
};

function getVersionItems(
  versions: GlobalVersion[],
  configs?: PropVersions,
): VersionItem[] {
  if (configs) {
    const versionMap = new Map<string, GlobalVersion>(
      versions.map((version) => [version.name, version]),
    );

    const toVersionItem = (
      name: string,
      config?: PropVersionItem,
    ): VersionItem => {
      const version = versionMap.get(name);
      if (!version) {
        throw new Error(`No docs version exist for name '${name}', please verify your 'docsVersionDropdown' navbar item versions config.
Available version names:\n- ${versions.map((v) => `${v.name}`).join('\n- ')}`);
      }
      return {version, label: config?.label ?? version.label};
    };

    if (Array.isArray(configs)) {
      return configs.map((name) => toVersionItem(name, undefined));
    } else {
      return Object.entries(configs).map(([name, config]) =>
        toVersionItem(name, config),
      );
    }
  } else {
    return versions.map((version) => ({version, label: version.label}));
  }
}

function useVersionItems({
  docsPluginId,
  configs,
}: {
  docsPluginId: Props['docsPluginId'];
  configs: Props['versions'];
}): VersionItem[] {
  const versions = useVersions(docsPluginId);
  return getVersionItems(versions, configs);
}

function getVersionMainDoc(version: GlobalVersion): GlobalDoc {
  return version.docs.find((doc) => doc.id === version.mainDocId)!;
}

function getVersionTargetDoc(
  version: GlobalVersion,
  activeDocContext: ActiveDocContext,
): GlobalDoc {
  return (
    activeDocContext.alternateDocVersions[version.name] ??
    getVersionMainDoc(version)
  );
}

/**
 * 主站 docs 的 routeBasePath 为 "/" 时，getActiveVersion 会把子插件路径也前缀匹配到
 * 「最新发布版」的 version.path，导致 activeVersion 误判。仅当当前 URL 对应该插件的
 * 某篇文档（activeDoc）时，才把 activeVersion 作为候选，否则保留 preferred / latest。
 */
function useDocsVersionCandidatesForDropdown(
  docsPluginId: Props['docsPluginId'],
): GlobalVersion[] {
  const {activeVersion, activeDoc} = useActiveDocContext(docsPluginId);
  const {preferredVersion} = useDocsPreferredVersion(docsPluginId);
  const latestVersion = useLatestVersion(docsPluginId);
  return useMemo(
    () =>
      uniq(
        [
          activeDoc ? activeVersion : undefined,
          preferredVersion,
          latestVersion,
        ].filter(Boolean),
      ),
    [activeDoc, activeVersion, preferredVersion, latestVersion],
  );
}

function useDisplayedVersionItem({
  docsPluginId,
  versionItems,
}: {
  docsPluginId: Props['docsPluginId'];
  versionItems: VersionItem[];
}): VersionItem {
  const candidates = useDocsVersionCandidatesForDropdown(docsPluginId);
  const candidateItems = candidates
    .map((candidate) => versionItems.find((vi) => vi.version === candidate))
    .filter((vi) => vi !== undefined);
  return candidateItems[0] ?? versionItems[0]!;
}

export default function DocsVersionDropdownNavbarItem({
  mobile,
  docsPluginId,
  dropdownActiveClassDisabled,
  dropdownItemsBefore,
  dropdownItemsAfter,
  versions: configs,
  ...props
}: Props): ReactNode {
  const {search, hash} = useLocation();
  const {i18n} = useDocusaurusContext();
  const activeDocContext = useActiveDocContext(docsPluginId);
  const {savePreferredVersionName} = useDocsPreferredVersion(docsPluginId);
  const versionItems = useVersionItems({docsPluginId, configs});
  const displayedVersionItem = useDisplayedVersionItem({
    docsPluginId,
    versionItems,
  });

  const versionLabelPrefix =
    i18n.currentLocale === 'en' ? 'Version: ' : '版本：';

  function versionItemToLink({
    version,
    label,
  }: VersionItem): LinkLikeNavbarItemProps {
    const targetDoc = getVersionTargetDoc(version, activeDocContext);
    return {
      label,
      to: `${targetDoc.path}${search}${hash}`,
      isActive: () =>
        !!activeDocContext.activeDoc &&
        version === activeDocContext.activeVersion,
      onClick: () => savePreferredVersionName(version.name),
    };
  }

  const items: LinkLikeNavbarItemProps[] = [
    ...dropdownItemsBefore,
    ...versionItems.map(versionItemToLink),
    ...dropdownItemsAfter,
  ];

  const dropdownLabel =
    mobile && items.length > 1
      ? translate({
          id: 'theme.navbar.mobileVersionsDropdown.label',
          message: 'Versions',
          description:
            'The label for the navbar versions dropdown on mobile view',
        })
      : `${versionLabelPrefix}${displayedVersionItem.label}`;

  const dropdownTo =
    mobile && items.length > 1
      ? undefined
      : getVersionTargetDoc(displayedVersionItem.version, activeDocContext)
          .path;

  if (items.length <= 1) {
    return (
      <DefaultNavbarItem
        {...props}
        mobile={mobile}
        label={dropdownLabel}
        to={dropdownTo}
        isActive={dropdownActiveClassDisabled ? () => false : undefined}
      />
    );
  }

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={dropdownLabel}
      to={dropdownTo}
      items={items}
      isActive={dropdownActiveClassDisabled ? () => false : undefined}
    />
  );
}
