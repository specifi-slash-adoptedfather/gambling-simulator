import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appJsonPath = path.join(root, 'dist', 'build', 'mp-weixin', 'app.json');
const projectConfigPath = path.join(root, 'dist', 'build', 'mp-weixin', 'project.config.json');
const manifestPath = path.join(root, 'src', 'manifest.json');

let mpWeixinAppId = '';
if (fs.existsSync(manifestPath)) {
  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  mpWeixinAppId = manifest?.['mp-weixin']?.appid || '';
}

if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.lazyCodeLoading = 'requiredComponents';
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
}

if (fs.existsSync(projectConfigPath)) {
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
  projectConfig.setting = projectConfig.setting || {};
  projectConfig.setting.minified = true;
  if (mpWeixinAppId) {
    projectConfig.appid = mpWeixinAppId;
  }
  fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2));
}
