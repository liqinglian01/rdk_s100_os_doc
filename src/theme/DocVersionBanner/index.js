/**
 * Swizzled from @docusaurus/theme-classic DocVersionBanner:
 * unmaintained banner uses one combined sentence (zh copy), link target unchanged.
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

function UnmaintainedCombinedBanner({
  className,
  siteTitle,
  versionMetadata,
  latestVersionSuggestedDoc,
  latestVersionSuggestion,
  savePreferredVersionName,
}) {
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  const link = (
    <b>
      <Link
        to={latestVersionSuggestedDoc.path}
        onClick={() =>
          savePreferredVersionName(latestVersionSuggestion.name)
        }>
        {currentLocale === 'zh-Hans' ? (
          '最新版本'
        ) : (
          <Translate
            id="theme.docs.versions.latestVersionLinkLabel"
            description="The label used for the latest version suggestion link label">
            latest version
          </Translate>
        )}
      </Link>
    </b>
  );

  return (
    <div
      className={clsx(
        className,
        ThemeClassNames.docs.docVersionBanner,
        'alert alert--warning margin-bottom--md',
      )}
      role="alert">
      <div>
        {currentLocale === 'zh-Hans' ? (
          <>
            此为 {siteTitle} <b>{versionMetadata.label}</b>{' '}
            版的文档，最新的文档请参阅 {link} (
            {latestVersionSuggestion.label})
          </>
        ) : (
          <Translate
            id="theme.docs.versions.unmaintainedVersionCombinedLabel"
            description="Combined unmaintained version banner (single sentence)"
            values={{
              siteTitle,
              versionLabel: <b>{versionMetadata.label}</b>,
              latestVersionLabel: latestVersionSuggestion.label,
              latestVersionLink: link,
            }}>
            {
              'This is documentation for {siteTitle} {versionLabel}. For the latest documentation, see {latestVersionLink} ({latestVersionLabel}).'
            }
          </Translate>
        )}
      </div>
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

  if (versionMetadata.banner === 'unmaintained') {
    if (!latestVersionSuggestedDoc?.path) {
      return null;
    }
    return (
      <UnmaintainedCombinedBanner
        className={className}
        siteTitle={siteTitle}
        versionMetadata={versionMetadata}
        latestVersionSuggestedDoc={latestVersionSuggestedDoc}
        latestVersionSuggestion={latestVersionSuggestion}
        savePreferredVersionName={savePreferredVersionName}
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
  if (versionMetadata.banner) {
    return (
      <DocVersionBannerEnabled
        className={className}
        versionMetadata={versionMetadata}
      />
    );
  }
  return null;
}
