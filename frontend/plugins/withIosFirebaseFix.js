const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withIosFirebaseFix = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      const script = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] ||= ['$(inherited)']
        config.build_settings['OTHER_CFLAGS'] << '-Wno-error=non-modular-include-in-framework-module'
      end
    end
`;

      // Find the post_install block and add our script
      const postInstallHook = 'post_install do |installer|';
      if (podfileContent.includes(postInstallHook)) {
        podfileContent = podfileContent.replace(
          postInstallHook,
          `${postInstallHook}${script}`
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);

      return config;
    },
  ]);
};

module.exports = withIosFirebaseFix;
