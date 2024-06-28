import { ConfigPlugin, withAppBuildGradle, withProjectBuildGradle } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const modifyBuildGradle = async (filePath: string) => {
    try {
        let content = await fs.promises.readFile(filePath, 'utf8');
        const lineToComment = `codegenDir = new File(["node", "--print", "require.resolve('@react-native/codegen/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()`;

        if (content.includes(lineToComment)) {
            const commentedLine = `// ${lineToComment}`;
            content = content.replace(lineToComment, commentedLine);
            await fs.promises.writeFile(filePath, content, 'utf8');
        }
    } catch (error) {
        console.error(`Error commenting out codegenDir line in ${filePath}: ${error}`);
    }
};

const withCustomBuildGradleModification: ConfigPlugin = (config) => {
    return withProjectBuildGradle(config, async (config) => {
        const buildGradlePath = path.resolve(config.modRequest.platformProjectRoot, 'app', 'build.gradle');
        await modifyBuildGradle(buildGradlePath);
        return config;
    });
};

export default withCustomBuildGradleModification;
