"use strict";
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        app: ["babel-polyfill", "./src/index.js"],
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name].js",
    },
    devServer: {
        contentBase: "./dist",
        host: "localhost",
        port: 9000,
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader", query: { presets: ['env', 'react'] } },
            { test: /assets(?=\/|\\)/, loader: "file-loader?name=assets/[name].[ext]" },
            { test: /shader(?=\/|\\)/, loader: "file-loader?name=shader/[name].[ext]" },
        ],
    },
    devtool: "source-map",
    plugins: [
        new HtmlWebpackPlugin({
            template: `${__dirname}/src/index.html`,
            filename: 'index.html',
            inject: 'body',
        }),
    ],
};
