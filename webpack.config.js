"use strict";

module.exports = {
    entry: {
        app: ["babel-polyfill", "./src/index.js"],
        "gl-matrix": ["gl-matrix"],
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name].js",
    },
    devServer: {
        contentBase: "./dist",
        host: "140.118.127.152",
        port: 9000,
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader", query: { presets: ['env'] } },
            { test: /gl-matrix/, loader: "babel-loader", query: { presets: ['env'] } },
            { test: /\.html?$/, loader: "file-loader?name=[name].[ext]" },
            { test: /assets(?=\/|\\)/, loader: "file-loader?name=assets/[name].[ext]" },
        ],
    },
    devtool: "source-map",
};
