const CompressionWebpackPlugin = require('compression-webpack-plugin')

/** 区分打包环境与开发环境
 * process.env.NODE_ENV==='production'  (打包环境)
 * process.env.NODE_ENV==='development' (开发环境)
 */
const port = process.env.port || process.env.npm_config_port || 9528
module.exports = {
  // 基本路径
  publicPath: './',
  // 静态文件夹
  assetsDir: 'static',
  // 输出文件目录
  outputDir: `dist/`,
  // eslint-loader 是否在保存的时候检查
  lintOnSave: true,
  devServer: {
    port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    
  },
  // webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        '@libs': '@/libs',
        '@router': '@/router',
        '@views': '@/views',
        '@components': '@/components',
        '@store': '@/store'
      }
    },
    plugins: [
      // 极致压缩js
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: new RegExp(
          '\\.(js|css)$'
        ),
        threshold: 10240,
        minRatio: 0.8
      })
    ]
  },
  // css相关配置
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  }
}
