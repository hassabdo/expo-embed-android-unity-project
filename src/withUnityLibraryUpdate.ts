import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

async function writeToLocalProperties(unityProjectPath: string, sdkDir: string, ndkDir: string): Promise<any> {
    const sourcePath = path.resolve(unityProjectPath, 'local.properties');
    const destinationPath = path.resolve(unityProjectPath, 'unityLibrary/local.properties');
    const content = `sdk.dir=${sdkDir}\nndk.dir=${ndkDir}`;
    try {
        // Write the content to unityLibrary/local.properties
        await fs.promises.writeFile(sourcePath, content, 'utf8');
        await fs.promises.writeFile(destinationPath, content, 'utf8');
    } catch (error) {
        // File not found or error reading/writing file
        console.error(`Error copying local.properties: ${error}`);
    }
}


export async function updateUnityLibraryBuildGradle(unityProjectPath: string): Promise<any> {
    const unitySdkPath = process.env.UNITY_SDK_PATH;
    const unityNdkPath = process.env.UNITY_NDK_PATH;

    if (!unitySdkPath || !unityNdkPath) {
      throw new Error('UNITY_SDK_PATH and UNITY_NDK_PATH environment variables must be set.');
    }
    await writeToLocalProperties(unityProjectPath, unitySdkPath, unityNdkPath)
    const unityLibraryBuildGradlePath = path.resolve(unityProjectPath, 'unityLibrary/build.gradle');
    // Define the content to be added
    const methodContent = `
def getNdkDir() {
    Properties local = new Properties()
    local.load(new FileInputStream("\${projectDir}/local.properties"))
    return local.getProperty('ndk.dir')
}
`;

    // Read the existing content of unityLibrary/build.gradle
    let existingContent = await fs.promises.readFile(unityLibraryBuildGradlePath, 'utf8');

    // Find the position of getSdkDir() method
    const sdkDirMethodIndex = existingContent.indexOf('def getSdkDir()');
    const ndkDirMethodIndex = existingContent.indexOf('def getNdkDir()');

    if (ndkDirMethodIndex == -1) {
        if (sdkDirMethodIndex !== -1) {
            // Insert the method content after getSdkDir() method
            let updatedContent = existingContent.slice(0, sdkDirMethodIndex) + methodContent + "\n" + existingContent.slice(sdkDirMethodIndex);
            // Replace the line with the new content
            updatedContent = updatedContent.replace(
                /android\.ndkDirectory/,
                'getNdkDir()'
            );
            updatedContent = updatedContent.replace(
                /rootDir/,
                'projectDir'
            );
            await fs.promises.writeFile(unityLibraryBuildGradlePath, updatedContent, 'utf8');
        } else {
            console.warn('Method getSdkDir() not found in unityLibrary/build.gradle');
        }
    } else {
        console.warn('Method getNdkDir() already exists in unityLibrary/build.gradle');
    }
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