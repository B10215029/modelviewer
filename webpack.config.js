"use strict";

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
            { test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader", query: { presets: ['es2015'] } },
            { test: /\.html?$/, loader: "file-loader?name=[name].[ext]" },
            { test: /assets(?=\/|\\)/, loader: "file-loader?name=assets/[name].[ext]" },
        ],
    },
    devtool: "source-map",
};
