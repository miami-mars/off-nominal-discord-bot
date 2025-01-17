import { Client } from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";
import { ContentFeedItem } from "../../content/handlers/handleNewContent";
import createDiscordEvent from "../actions/createDiscordEvent";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";
import fetchYouTubeVideo from "../actions/fetchYouTubeVideo";
import generateEventDetailsFromYouTube from "../actions/generateEventDetailsFromYouTube";

const ANNOUNCEMENTS_CHANNEL_ID = process.env.ANNOUNCEMENTSCHANNELID;

export default async function handleNewContent(
  content: ContentFeedItem,
  client: Client
) {
  try {
    const [video] = await fetchYouTubeVideo(content.id);
    const { liveStreamingDetails } = video;

    // do nothing if this video is not a livestream or if the livestream has ended
    if (!liveStreamingDetails || liveStreamingDetails.actualEndTime) {
      return;
    }
    const eventDetails = generateEventDetailsFromYouTube(video);
    const event = await createDiscordEvent(eventDetails, client);
    const embed = createEventAnnouncementEmbed(event, "new");
    const channel = await fetchTextChannel(client, ANNOUNCEMENTS_CHANNEL_ID);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
