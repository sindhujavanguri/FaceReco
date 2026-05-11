const fs = require('fs');
const path = require('path');

const gradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-face-detection',
  'android',
  'build.gradle',
);

if (!fs.existsSync(gradlePath)) {
  process.exit(0);
}

let source = fs.readFileSync(gradlePath, 'utf8');

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

fs.writeFileSync(gradlePath, source);
