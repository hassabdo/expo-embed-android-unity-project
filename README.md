# expo-embed-android-unity-project

An Expo config plugin to embed a Unity Android project as a library into an Expo project using [`@azesmway/react-native-unity`](https://github.com/azesmway/react-native-unity).

## Installation

First, install the necessary dependencies:

```bash
npm install @azesmway/react-native-unity 
```

```bash
npm install expo-embed-android-unity-project
```

## Assumptions

- This plugin assumes that your Unity project is exported to <YOUR_EXPO_PROJECT>/unity/builds/android.
You can change this default setting in plugin definition in app.json.

- UNITY_SDK_PATH and UNITY_NDK_PATH environnement variables set.

## Usage

In app.json

```json
{
  "expo": {
    "plugins": [
      "expo-embed-android-unity-project"
    ]
  }
}
```

## Features

This plugin automatically:

  - Embeds a Unity Android project as a library into your Expo project using @azesmway/react-native-unity.
  - Modifies build.gradle to comment out specific lines.
  - Updates the gradle.properties file to set android.minSdkVersion.
  - Copies local.properties from Unity project to the appropriate directory.
  - Removes <intent-filter> block from the Unity project's AndroidManifest.xml.
  - Adds necessary configurations in projectBuildGradle and settingsGradle.
  
## How It Works

The plugin leverages @azesmway/react-native-unity, which allows embedding a Unity project into a React Native project as a full-fledged component. This Expo plugin extends that capability to Expo projects, handling necessary Android project configurations and integrations automatically.

## Credits 

This plugin is built upon the excellent work done by @azesmway on the @azesmway/react-native-unity library.

## Contributing  

Feel free to open issues or submit pull requests for any bugs or enhancements.

## License

MIT

This version of the `README.md` includes a "Credits" section that acknowledges `@azesmway` and provides links to their GitHub profile and the `@azesmway/react-native-unity` library. This ensures that proper credit is given and users can easily find more information about the underlying library.


## Additional Tips:

- **Test Thoroughly:** Make sure to test your plugin thoroughly to ensure it works as expected with different configurations and scenarios.
- **Versioning:** Use semantic versioning to manage your plugin's versions. Update the version in `package.json` accordingly before publishing new changes.
- **Documentation:** Keep your documentation up-to-date with any changes or enhancements you make to the plugin.

By following these steps, you should have a comprehensive `README.md` that clearly explains the functionality and usage of your plugin. Once you're ready, you can publish your plugin to npm using the steps outlined earlier.
