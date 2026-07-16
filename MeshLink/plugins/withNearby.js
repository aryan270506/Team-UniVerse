const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to inject Google Nearby Connections native library
 * and copy the Kotlin bridge files during prebuild.
 */
function withNearby(config) {
  // 1. Inject the Play Services Nearby dependency into build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let content = config.modResults.contents;
      
      // Ensure we don't duplicate the dependency
      if (!content.includes('play-services-nearby')) {
        content = content.replace(
          /dependencies\s*\{/,
          `dependencies {\n    implementation "com.google.android.gms:play-services-nearby:18.7.0"`
        );
        config.modResults.contents = content;
      }
    }
    return config;
  });

  // 2. Copy/Create NearbyModule.kt and NearbyPackage.kt in dangerous mod (prebuild file generation)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const androidDir = config.modRequest.platformProjectRoot;
      const packagePath = 'com/sekirohub/MeshLink';
      const javaSourceDir = path.join(androidDir, 'app/src/main/java', packagePath);

      // Create target directory if it doesn't exist
      fs.mkdirSync(javaSourceDir, { recursive: true });

      // Read files from plugins/ source folder and copy them to android folder
      const sourceDir = path.join(config.modRequest.projectRoot, 'plugins');
      
      const filesToCopy = ['NearbyModule.kt', 'NearbyPackage.kt'];
      
      for (const file of filesToCopy) {
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(javaSourceDir, file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`[MeshLink Config Plugin] Copied ${file} to ${destFile}`);
        } else {
          console.warn(`[MeshLink Config Plugin] Source file not found: ${srcFile}`);
        }
      }

      // 3. Register NearbyPackage in MainApplication.kt
      const mainApplicationPath = path.join(javaSourceDir, 'MainApplication.kt');
      if (fs.existsSync(mainApplicationPath)) {
        let content = fs.readFileSync(mainApplicationPath, 'utf8');
        
        // Add package import if missing
        if (!content.includes('import com.sekirohub.MeshLink.NearbyPackage')) {
          content = content.replace(
            /package com\.sekirohub\.MeshLink/,
            `package com.sekirohub.MeshLink\n\nimport com.sekirohub.MeshLink.NearbyPackage`
          );
        }

        // Add package to getPackages list (compatible with older Expo versions)
        if (content.includes('val packages = PackageList(this).packages.toMutableList()')) {
          if (!content.includes('packages.add(NearbyPackage())')) {
            content = content.replace(
              /val packages = PackageList\(this\)\.packages\.toMutableList\(\)/,
              `val packages = PackageList(this).packages.toMutableList()\n      packages.add(NearbyPackage())`
            );
          }
        }

        // Add package to packages.apply block (compatible with Expo SDK 57+)
        if (content.includes('PackageList(this).packages.apply {')) {
          if (!content.includes('add(NearbyPackage())')) {
            content = content.replace(
              /PackageList\(this\)\.packages\.apply\s*\{/,
              `PackageList(this).packages.apply {\n          add(NearbyPackage())`
            );
          }
        }
        
        fs.writeFileSync(mainApplicationPath, content, 'utf8');
        console.log(`[MeshLink Config Plugin] Registered NearbyPackage in MainApplication.kt`);
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withNearby;
