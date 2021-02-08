const {
    // ContextReplacementPlugin,
    DefinePlugin,
    DllPlugin,
    DllReferencePlugin,
    ProgressPlugin,
    NoEmitOnErrorsPlugin
  } = require('webpack');


const { hasProcessFlag, root, testDll } = require('./helpers.js');

const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
//const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
// const AssetsPlugin = require('assets-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WebpackMd5Hash = require('webpack-md5-hash');
const { getAotPlugin } = require('./webpack.aot');

const DLL_VENDORS = [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/http',
    '@angular/material',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
    '@ngrx/effects',
    '@ngrx/router-store',
    '@ngrx/store',
    '@ngrx/store-devtools',
    'ngrx-store-freeze',
    'ngrx-store-logger',
    'rxjs'
  
];
const COPY_FOLDERS = [
    { from: 'src/assets', to: 'assets' },
    { from: 'node_modules/hammerjs/hammer.min.js' },
    { from: 'node_modules/hammerjs/hammer.min.js.map' }
  //  { from: 'src/assets/volvo/styles/styles.css' }
    
];
const EVENT = process.env.npm_lifecycle_event || '';
const DLL = EVENT.includes('dll');
const DEV_SERVER = EVENT.includes('webdev');
const AOT = EVENT.includes('aot') || hasProcessFlag('aot');
const clientConfig = function webpackConfig(): WebpackConfig {
    let config: WebpackConfig = Object.assign({});

    config.module = {
        rules: [
            {
                test: /\.js$/,
                loader: 'source-map-loader'
              //  exclude: [constant.EXCLUDE_SOURCE_MAPS]
            },
            {
                test: /\.ts$/,
                loaders: !DLL && !DEV_SERVER ? ['@ngtools/webpack'] : [
                    '@angularclass/hmr-loader',
                    'awesome-typescript-loader?{configFileName: "tsconfig.webpack.json"}',
                    'angular2-template-loader',
                    'angular-router-loader?loader=system&genDir=compiled&aot=' + AOT
                ],
                exclude: [/\.(spec|e2e|d)\.ts$/]
            },
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.html/, loader: 'raw-loader', exclude: [root('src/index.html')] },
            {
                test: /\.css$/,
                // loader: 'raw-loader'
                // exclude: /node_modules/,
                loaders: ['to-string-loader', 'css-loader']
            }
            
        ]
    };

    config.plugins = [
        getAotPlugin('client', AOT),
        // new ContextReplacementPlugin(
        //   /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        //   root('./src')
        // ),
        new ProgressPlugin(),
        new CheckerPlugin(),
       // new DefinePlugin(CONSTANTS),
        new NamedModulesPlugin(),
        new WebpackMd5Hash(),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            // inject: true,
            // metadata: {
            //     isDevServer: DEV_SERVER,
            //     performAppDynamics: QA || PROD,
            //     appDynamicKey: appDynamicKey
            // }
        })
       // ...constant.MY_CLIENT_PLUGINS
    ];

    if (DEV_SERVER) {
        config.plugins.push(
            new DllReferencePlugin({
                context: '.',
                manifest: require(`./dll/polyfill-manifest.json`)
            }),
            new DllReferencePlugin({
                context: '.',
                manifest: require(`./dll/vendor-manifest.json`)
            })
        );
    }

    if (DLL) {
        config.plugins.push(
            new DllPlugin({
                name: '[name]',
                path: root('dll/[name]-manifest.json'),
            })
        );
    } else {
        config.plugins.push(
            new CopyWebpackPlugin(COPY_FOLDERS, { ignore: ['*dist_root/*'] })
           // new CopyWebpackPlugin([{ from: 'src/assets/dist_root' }])
        );
    }
        config.plugins.push(
            new NoEmitOnErrorsPlugin()
            // new UglifyJsPlugin({
            //     beautify: false,
            //     comments: false
            // }),
            // new CompressionPlugin({
            //     asset: '[path].gz[query]',
            //     algorithm: 'gzip',
            //     test: /\.js$|\.html$/,
            //     threshold: 10240,
            //     minRatio: 0.8
            // })
            // assetsPluginInstance,
           
        );
        
    

   
    if (DLL) {
        config.entry = {
            app_assets: ['./src/main.browser'],
            polyfill: [
                'sockjs-client',
                '@angularclass/hmr',
                'ts-helpers',
                'zone.js',
                'core-js/client/shim.js',
                'core-js/es6/reflect.js',
                'core-js/es7/reflect.js',
                'querystring-es3',
                'strip-ansi',
                'url',
                'punycode',
                'events',
                'web-animations-js/web-animations.min.js',
                'webpack-dev-server/client/socket.js',
                'webpack/hot/emitter.js',
                'zone.js/dist/long-stack-trace-zone.js'
               
            ],
            vendor: [...DLL_VENDORS]
        };
    } else {
        config.entry = {
            main: root('./src/main.browser.ts')
        };
    }

    if (!DLL) {
        config.output = {
            path: root('dist/client'),
            filename: '[name].[chunkhash].index.js',
            chunkFilename: '[id].[chunkhash].chunk.js'
            //filename: !(PROD || AOT) ? '[name].js' : '[name].[chunkhash].index.js',
            //sourceMapFilename: !PROD ? '[name].bundle.map' : '[name].[chunkhash].bundle.map',
            //chunkFilename: !(PROD || AOT) ? '[id].chunk.js' : '[id].[chunkhash].chunk.js'
        };
    } else {
        config.output = {
            path: root('dll'),
            filename: '[name].dll.js',
            library: '[name]'
        };
    }

    config.devServer = {
        contentBase: AOT ? './compiled' : './src',
        historyApiFallback: {
            disableDotRule: true,
        },
        stats: 'minimal',
        host: '0.0.0.0'
       // watchOptions: constant.DEV_SERVER_WATCH_OPTIONS
    };

   

    config.performance = {
        hints: false
    };

    config.node = {
        global: true,
        process: true,
        Buffer: false,
        crypto: true,
        module: false,
        clearImmediate: false,
        setImmediate: false,
        clearTimeout: true,
        setTimeout: true
    };

    config.resolve = {
        extensions: ['.ts', '.js', '.json']
    };

    return config;
}();
module.exports = clientConfig;