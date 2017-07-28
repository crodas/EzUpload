var path = require('path');
var webpack = require('webpack');

var config = {
     entry: './client/upload',
     output: {
         path: __dirname,
         filename: 'dist/ezupload.js',
         library: ['FileUploader'],
     },
     module: {
         loaders: [{
             test: /\.js$/,
             loader: 'babel-loader',
             exclude: /node_modules/i,
             query: {
                 presets: ['stage-2', 'es2015', 'stage-0']
             }    
         }]
    }
};

module.exports = config;
