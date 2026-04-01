import path from "path";

export default {
  entry: "./src/index.ts",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  output: {
    path: path.resolve(import.meta.dirname, "dist"),
    filename: "bundle.js",
  },
  experiments: {
    asyncWebAssembly: true,
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
  devtool: "source-map",
};
