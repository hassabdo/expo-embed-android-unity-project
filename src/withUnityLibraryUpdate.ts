import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

async function removeLocalProperties(unityProjectPath: string): Promise<any> {
    const localPropertiesPath = path.resolve(unityProjectPath, 'local.properties');
    try {
        await fs.promises.unlink(localPropertiesPath);
        console.log(`Removed local.properties from ${localPropertiesPath}`);
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        console.warn(`local.properties not found at ${localPropertiesPath}, skipping removal.`);
    }
}


export async function updateUnityLibraryBuildGradle(unityProjectPath: string): Promise<any> {
    const unityNdkVersion = process.env.UNITY_NDK_VERSION;

    if (!unityNdkVersion) {
        throw new Error('UNITY_NDK_VERSION environment variable must be set.');
    }

    await removeLocalProperties(unityProjectPath)
    const unityLibraryBuildGradlePath = path.resolve(unityProjectPath, 'unityLibrary/build.gradle');

    // Read the existing content of unityLibrary/build.gradle
    let existingContent = await fs.promises.readFile(unityLibraryBuildGradlePath, 'utf8');
    // Remove the existing getNdkDir and getSdkDir methods if they exist
    existingContent = existingContent.replace(/def getNdkDir\(\) \{[^}]+\}/g, '');
    existingContent = existingContent.replace(/def getSdkDir\(\) \{[^}]+\}/g, '');
    // Add ndkVersion to defaultConfig if it doesn't exist
    if (!existingContent.includes('ndkVersion')) {
        existingContent = existingContent.replace(/defaultConfig \{/, `defaultConfig {\n        ndkVersion "${unityNdkVersion}"`);
    }

    // Replace all occurrences of getNdkDir() and getSdkDir() with the respective properties
    existingContent = existingContent.replace(/getNdkDir\(\)/g, 'android.ndkDirectory.absolutePath');
    existingContent = existingContent.replace(/getSdkDir\(\)/g, 'android.sdkDirectory.absolutePath');

    // Write the updated content back to the build.gradle file
    await fs.promises.writeFile(unityLibraryBuildGradlePath, existingContent, 'utf8');
}

export async function removeIntentFilter(unityProjectPath: string): Promise<any> {
    const androidManifestPath = path.resolve(unityProjectPath, 'unityLibrary/src/main/AndroidManifest.xml');

    try {
        // Read the content of AndroidManifest.xml
        let content = await fs.promises.readFile(androidManifestPath, 'utf8');

        // Parse the XML content
        const parser = new xml2js.Parser();
        const parsedXml = await parser.parseStringPromise(content);

        // Find the activity node containing the intent-filter to remove
        const activities = parsedXml.manifest.application[0].activity;
        if (activities) {
            activities.forEach((activity: any) => {
                if (activity['intent-filter']) {
                    delete activity['intent-filter'];
                }
                if (!activity['$']['android:exported']) {
                    activity['$']['android:exported'] = 'true';
                }
            });
        }
        parsedXml.manifest.application[0].activity = activities
        // Convert the modified XML back to string
        const builder = new xml2js.Builder({
            xmldec: {
                'version': '1.0',
                'encoding': 'utf-8',
            }
        });
        content = builder.buildObject(parsedXml);

        // Write the updated content back to the file
        await fs.promises.writeFile(androidManifestPath, content, 'utf8');
    } catch (error) {
        // File not found or error reading/writing file
        console.error(`Error removing intent filter from AndroidManifest.xml: ${error}`);
    }
}