// Xcode 27 refuses pods whose deployment target is below iOS 15 (RNSVG, AsyncStorage
// resources). The build scripts used to force IPHONEOS_DEPLOYMENT_TARGET=15.1 on every
// target from the command line, but that also drags the Live Activity widget (16.2)
// down. Raise only the old pods instead, in the Podfile's post_install.
const { withPodfile } = require("expo/config-plugins");

const MARKER = "# withPodDeploymentTarget";
const MIN = "15.1";

const SNIPPET = `
    ${MARKER}: raise pods older than iOS ${MIN}.
    installer.pods_project.targets.each do |pod_target|
      pod_target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current && Gem::Version.new(current) < Gem::Version.new('${MIN}')
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN}'
        end
      end
    end
`;

const POST_INSTALL_CALL = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;

function patchPodfile(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!POST_INSTALL_CALL.test(contents)) {
    throw new Error("withPodDeploymentTarget: no react_native_post_install call in the Podfile");
  }
  return contents.replace(POST_INSTALL_CALL, `$1${SNIPPET}`);
}

const withPodDeploymentTarget = (config) =>
  withPodfile(config, (cfg) => {
    cfg.modResults.contents = patchPodfile(cfg.modResults.contents);
    return cfg;
  });

module.exports = withPodDeploymentTarget;
module.exports.patchPodfile = patchPodfile;
