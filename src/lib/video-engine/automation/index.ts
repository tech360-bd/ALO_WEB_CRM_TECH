/**
 * Automation Index
 * Aggregates: youtube-dl, reddit-maker, claude-video, slideshow, animated, videomaker-aggregator, telegram-bot
 */

export * from "./youtube";
export * from "./reddit-video";
export * from "./claude-video";
export * from "./slideshow";
export * from "./animated";
export * from "./videomaker-aggregator";
export * from "./telegram-bot";

import { getYoutubeDlHealth } from "./youtube";
import { getRedditMakerHealth } from "./reddit-video";
import { getClaudeVideoHealth } from "./claude-video";
import { getSlideshowHealth } from "./slideshow";
import { getAnimatedHealth } from "./animated";
import { getVideoMakerAggregatorHealth } from "./videomaker-aggregator";
import { getTelegramBotHealth } from "./telegram-bot";

export async function getAutomationProvidersHealth() {
  const [youtube, reddit, claudeVideo, slideshow, animated, aggregator, telegram] = await Promise.all([
    getYoutubeDlHealth(),
    getRedditMakerHealth(),
    getClaudeVideoHealth(),
    getSlideshowHealth(),
    getAnimatedHealth(),
    getVideoMakerAggregatorHealth(),
    getTelegramBotHealth(),
  ]);
  return { youtube, reddit, claudeVideo, slideshow, animated, aggregator, telegram };
}
