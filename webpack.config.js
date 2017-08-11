var path = require('path');
var nodeExternals = require('webpack-node-externals');
var webpack = require('webpack');

var config = {
    entry: './client/index',
    output: {
         path: __dirname,
         filename: 'dist/ezupload.js',
         library: ['FileUploader'],
         libraryTarget: 'this',
     },
    target: 'node',
    module: {
         loaders: [{
             test: /\.js$/,
             loader: 'babel-loader',
             exclude: /node_modules|sha256/i,
             query: {
                 presets: ['stage-2', 'es2015', 'stage-0']
             }    
         }]
    }
};

module.exports = config;
