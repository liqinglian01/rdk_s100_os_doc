/**
 * Swizzled from @docusaurus/theme-classic DocVersionBanner:
 * Latest published (isLast) + unmaintained: same zh/en copy (product table + top-nav hint).
 * Unreleased (Next): classic unreleased + latest-version suggestion.
 */
import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {
  useActivePlugin,
  useDocVersionSuggestions,
} from '@docusaurus/plugin-content-docs/client';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {
  useDocsPreferredVersion,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';

import styles from './styles.module.css';

function UnreleasedVersionLabel({siteTitle, versionMetadata}) {
  return (
    <Translate
      id="theme.docs.versions.unreleasedVersionLabel"
      description="The label used to tell the user that he's browsing an unreleased doc version"
      values={{
        siteTitle,
        versionLabel: <b>{versionMetadata.label}</b>,
      }}>
      {
        'This is unreleased documentation for {siteTitle} {versionLabel} version.'
      }
    </Translate>
  );
}

const BannerLabelComponents = {
  unreleased: UnreleasedVersionLabel,
};

function BannerLabel(props) {
  const BannerLabelComponent =
    BannerLabelComponents[props.versionMetadata.banner];
  return <BannerLabelComponent {...props} />;
}

function LatestVersionSuggestionLabel({versionLabel, to, onClick}) {
  return (
    <Translate
      id="theme.docs.versions.latestVersionSuggestionLabel"
      description="The label used to tell the user to check the latest version"
      values={{
        versionLabel,
        latestVersionLink: (
          <b>
            <Link to={to} onClick={onClick}>
              <Translate
                id="theme.docs.versions.latestVersionLinkLabel"
                description="The label used for the latest version suggestion link label">
                latest version
              </Translate>
            </Link>
          </b>
        ),
      }}>
      {
        'For up-to-date documentation, see the {latestVersionLink} ({versionLabel}).'
      }
    </Translate>
  );
}

function UnmaintainedVersionBannerTable({locale}) {
  const isZh = locale === 'zh-Hans';
  const hProduct = isZh ? '所属产品' : 'Product';
  const hChain = isZh ? '算法工具链' : 'Algorithm toolchain';
  const rowLabel = isZh ? '版本关联关系' : 'Version mapping';

  return (
    <div className={clsx(styles.tableSurface, 'margin-top--md')}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{hProduct}</th>
            <th>RDK S100 OS</th>
            <th>ModelZoo</th>
            <th>TogetheROS</th>
            <th>{hChain}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th rowSpan={2}>{rowLabel}</th>
            <td>1.0.0</td>
            <td>1.0.1</td>
            <td>1.0.6</td>
            <td>2.6.6</td>
          </tr>
          <tr>
            <td>1.0.5</td>
            <td>1.0.1</td>
            <td>1.0.5</td>
            <td>2.2.6</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VersionInfoCombinedBanner({className, siteTitle, versionMetadata}) {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  return (
    <div
      className={clsx(
        className,
        ThemeClassNames.docs.docVersionBanner,
        styles.banner,
        'alert alert--warning margin-bottom--md',
      )}
      role="alert">
      <div>
        {currentLocale === 'zh-Hans' ? (
          <div>
            当前正在阅读<b>
              {' '}
              {siteTitle} {versionMetadata.label}{' '}
            </b>
            文档。
            <br />
            与其他产品版本对应关系参见下表，查阅时请在顶部导航选择对应版本。
          </div>
        ) : (
          <div>
            You are currently reading the{' '}
            <b>
              {siteTitle} {versionMetadata.label}
            </b>{' '}
            documentation.
            <br />
            See the table below for how versions map across products. When
            browsing, select the matching version from the top navigation.
          </div>
        )}
      </div>
      <UnmaintainedVersionBannerTable locale={currentLocale} />
    </div>
  );
}

function DocVersionBannerEnabled({className, versionMetadata}) {
  const {
    siteConfig: {title: siteConfigTitle, customFields},
  } = useDocusaurusContext();
  const {pluginId} = useActivePlugin({failfast: true});
  const siteTitle =
    customFields?.docsInstanceDisplayNames?.[pluginId] ?? siteConfigTitle;
  const getVersionMainDoc = (version) =>
    version.docs.find((doc) => doc.id === version.mainDocId);
  const {savePreferredVersionName} = useDocsPreferredVersion(pluginId);
  const {latestDocSuggestion, latestVersionSuggestion} =
    useDocVersionSuggestions(pluginId);
  const latestVersionSuggestedDoc =
    latestDocSuggestion ?? getVersionMainDoc(latestVersionSuggestion);

  const useVersionTableBanner =
    versionMetadata.banner === 'unmaintained' || versionMetadata.isLast === true;

  if (useVersionTableBanner) {
    return (
      <VersionInfoCombinedBanner
        className={className}
        siteTitle={siteTitle}
        versionMetadata={versionMetadata}
      />
    );
  }

  return (
    <div
      className={clsx(
        className,
        ThemeClassNames.docs.docVersionBanner,
        'alert alert--warning margin-bottom--md',
      )}
      role="alert">
      <div>
        <BannerLabel siteTitle={siteTitle} versionMetadata={versionMetadata} />
      </div>
      <div className="margin-top--md">
        <LatestVersionSuggestionLabel
          versionLabel={latestVersionSuggestion.label}
          to={latestVersionSuggestedDoc.path}
          onClick={() => savePreferredVersionName(latestVersionSuggestion.name)}
        />
      </div>
    </div>
  );
}

export default function DocVersionBanner({className}) {
  const versionMetadata = useDocsVersion();
  /** 最新发布版 banner 为 null；旧版为 unmaintained；Next 为 unreleased */
  if (!versionMetadata.isLast && !versionMetadata.banner) {
    return null;
  }
  return (
    <DocVersionBannerEnabled
      className={className}
      versionMetadata={versionMetadata}
    />
  );
}
