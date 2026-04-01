import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const isProduction = process.env.NODE_ENV === "production";

export default {
  entry: "./src/index.ts",
  mode: isProduction ? "production" : "development",
  output: {
    path: path.resolve(import.meta.dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    static: {
      directory: path.join(import.meta.dirname, "static"),
    },
    compress: true,
    port: 9000,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [{ test: /\.(ts|tsx)$/, loader: "ts-loader" }],
  },
  devtool: isProduction ? false : 'source-map',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "static" }],
    }),
  ],
};
