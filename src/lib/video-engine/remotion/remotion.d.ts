/**
 * Remotion type shims - allows build to pass even if remotion not installed
 * When remotion is installed (npm install remotion), real types will be used
 */

declare module "remotion" {
  export const AbsoluteFill: any;
  export const Sequence: any;
  export const Video: any;
  export const Audio: any;
  export const Img: any;
  export const Composition: any;
  export function registerRoot(comp: any): void;
  export function useCurrentFrame(): number;
  export function useVideoConfig(): { fps: number; durationInFrames: number; width: number; height: number };
  export function interpolate(input: number, inputRange: number[], outputRange: number[], options?: any): number;
  export function spring(options: any): number;
  export const Easing: any;
  export const staticFile: any;
}

declare module "@remotion/cli" {
  export const RenderInternals: any;
}

declare module "@remotion/player" {
  export const Player: any;
}

declare module "@remotion/lambda" {
  export const renderMediaOnLambda: any;
}

declare module "@remotion/media-utils" {
  export const getVideoMetadata: any;
}

declare module "youtube-dl-exec" {
  const youtubedl: any;
  export default youtubedl;
  export function exec(url: string, options?: any): Promise<any>;
}

declare module "fluent-ffmpeg" {
  const ffmpeg: any;
  export default ffmpeg;
}
