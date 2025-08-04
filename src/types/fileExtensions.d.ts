declare module "*.svg" {
  /**
   * Use `any` to avoid conflicts with
   * `@svgr/webpack` plugin or
   * `babel-plugin-inline-react-svg` plugin.
   */
  const content: unknown;

  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}
