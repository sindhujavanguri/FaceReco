const fs = require('fs');
const path = require('path');

const faceDetectionGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-face-detection',
  'android',
  'build.gradle',
);

if (fs.existsSync(faceDetectionGradlePath)) {
  let source = fs.readFileSync(faceDetectionGradlePath, 'utf8');

  source = source
    .replace(/jcenter\(\)/g, 'mavenCentral()')
    .replace(
      /compileSdkVersion safeExtGet\('FaceDetection_compileSdkVersion', 29\)/,
      "compileSdkVersion safeExtGet('FaceDetection_compileSdkVersion', safeExtGet('compileSdkVersion', 36))",
    )
    .replace(
      /\s*buildToolsVersion safeExtGet\('FaceDetection_buildToolsVersion', '29\.0\.2'\)/,
      '',
    )
    .replace(
      /minSdkVersion safeExtGet\('FaceDetection_minSdkVersion', 16\)/,
      "minSdkVersion safeExtGet('FaceDetection_minSdkVersion', safeExtGet('minSdkVersion', 24))",
    )
    .replace(
      /targetSdkVersion safeExtGet\('FaceDetection_targetSdkVersion', 29\)/,
      "targetSdkVersion safeExtGet('FaceDetection_targetSdkVersion', safeExtGet('targetSdkVersion', 36))",
    );

  fs.writeFileSync(faceDetectionGradlePath, source);
}

const asyncStorageGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-async-storage',
  'async-storage',
  'android',
  'build.gradle',
);

if (fs.existsSync(asyncStorageGradlePath)) {
  let source = fs.readFileSync(asyncStorageGradlePath, 'utf8');
  const localRepo = '    maven { url uri("$projectDir/local_repo") }';
  const repositoriesBlock = /repositories \{\r?\n    mavenCentral\(\)\r?\n    google\(\)\r?\n\}/;

  if (!source.includes('local_repo')) {
    source = source.replace(
      /repositories \{\r?\n/,
      `repositories {\n${localRepo}\n`,
    );
  }

  source = source.replace(
    repositoriesBlock,
    `repositories {\n${localRepo}\n    mavenCentral()\n    google()\n}`,
  );

  fs.writeFileSync(asyncStorageGradlePath, source);
}
