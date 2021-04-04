import { Message } from "discord.js";
import { FeedListener } from "../../../feeds/feedListener";

export const handleEpisodeNumberCommand = (
  message: Message,
  feedListener: FeedListener,
  episodeNumber: string
) => {
  const results = feedListener.search(episodeNumber);
  message.channel.send(results[0].item.url);
};
