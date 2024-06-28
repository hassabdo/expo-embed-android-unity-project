import {
  ConfigPlugin,
  withDangerousMod,
  withMod,
  withPlugins,
  withStringsXml,
} from '@expo/config-plugins';
import { removeIntentFilter, updateUnityLibraryBuildGradle } from './withUnityLibraryUpdate';
import withCustomBuildGradleModification from './withCustomBuildGradleModification';
import { ExpoConfig } from '@expo/config-types';
import * as path from 'path';

interface GradleProperty {
  type: string;
  key?: string;
  value: string;
}
const getConfigValue = (config: ExpoConfig, key: string, defaultValue: any) => {
  return config?.plugins?.find(
    ([pluginName]: any) => pluginName === 'expo-embed-android-unity-project'
  )?.[1]?.[key] || defaultValue;
};

const withCustomProjectBuildGradle: ConfigPlugin = (config) => {
  return withMod(config, {
    platform: 'android',
    mod: 'projectBuildGradle',
    action: async ({ modResults, ...config }) => {
      const buildGradle = modResults as { contents: string };
      const allProjectsIndex = buildGradle.contents.indexOf('allprojects');
      const repositoriesStartIndex = buildGradle.contents.indexOf('repositories', allProjectsIndex);
      const openingBracketIndex = buildGradle.contents.indexOf('{', repositoriesStartIndex);
      const modifiedContents = `${buildGradle.contents.slice(0, openingBracketIndex + 1)}
        //expo-embed-android-unity-project
        flatDir {
            dirs "\${project(':unityLibrary').projectDir}/libs"
        }
      ${buildGradle.contents.slice(openingBracketIndex + 1)}`;
      buildGradle.contents = modifiedContents;
      return { modResults: buildGradle, ...config };
    },
  });
};

const withCustomGradleProperties: ConfigPlugin = (config) => {
  return withMod(config, {
    platform: 'android',
    mod: 'gradleProperties',
    action: async ({ modResults, ...config }) => {
      const gradleProperties = modResults as GradleProperty[];
      return {
        modResults: [...gradleProperties,
        { type: "comment", value: "expo-embed-android-unity-project" },
        { type: "property", key: "unityStreamingAssets", value: ".unity3d" },
        ], ...config
      };
    },
  });
};

const withCustomSettingsGradle: ConfigPlugin = (config) => {
  const unityProjectPath = getConfigValue(config, 'unityProjectPath', 'unity/builds/android');
  return withMod(config, {
    platform: 'android',
    mod: 'settingsGradle',
    action: async ({ modResults, ...config }) => {
      const settingsGradle = modResults as { contents: string };
      settingsGradle.contents += `
//expo-embed-android-unity-project
include ':unityLibrary'
project(':unityLibrary').projectDir=new File('../${unityProjectPath}/unityLibrary')
      `;
      return { modResults: settingsGradle, ...config };
    },
  });
};
const withGameViewContentDescription: ConfigPlugin = (config) => {
  return withStringsXml(config, async (config) => {
    config.modResults.resources["string"]?.push({
      $: {
        "name": "game_view_content_description",
      },
      _: "Game view"
    });
    return config;
  });
};

const withUnityLibraryConfig: ConfigPlugin = (config) => {
  const unityProjectPath = getConfigValue(config, 'unityProjectPath', 'unity/builds/android');
  const unityProjectAbsolutePath = path.resolve(config?._internal?.projectRoot, unityProjectPath);
  const unitySdkVersion = getConfigValue(config, 'unitySdkVersion', '30.0.2');
  const unityNdkVersion = getConfigValue(config, 'unityNdkVersion', '21.3.6528147');
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      await updateUnityLibraryBuildGradle(unityProjectAbsolutePath);
      await removeIntentFilter(unityProjectAbsolutePath)
      return config;
    },
  ]);
  return config;
};

const withUnityProjectLink: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withCustomProjectBuildGradle,
    withCustomGradleProperties,
    withCustomSettingsGradle,
    withCustomBuildGradleModification,
    withGameViewContentDescription,
    withUnityLibraryConfig
  ]);
};

export default withUnityProjectLink;