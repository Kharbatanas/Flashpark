const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Handle pnpm workspace
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Mock native-only modules for web
const nativeModuleStub = path.resolve(__dirname, 'stubs/native-stub.js')
const nativeOnlyModules = ['react-native-maps']

const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (nativeOnlyModules.some((m) => moduleName === m || moduleName.startsWith(m + '/'))) {
      return { type: 'sourceFile', filePath: nativeModuleStub }
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
