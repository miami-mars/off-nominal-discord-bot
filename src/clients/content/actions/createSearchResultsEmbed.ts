import { format } from "date-fns";
import { MessageEmbed } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";

export const createSearchResultsEmbed = (
  results: Fuse.default.FuseResult<FeedItem>[],
  title: string,
  image: string,
  searchTerm: string
) => {
  return new MessageEmbed()
    .setColor("#3e7493")
    .setTitle("Search Results")
    .setAuthor(title)
    .setThumbnail(image)
    .setDescription(`Top three results for your search \`${searchTerm}\``)
    .addFields(
      results.map((result) => {
        const { description, summary, title, url, date } = result.item;
        const desc =
          description?.slice(0, 160) + "..." || summary.split("\n")[0];

        return {
          name: title,
          value: desc + `\n[[Link]](${url}) - ${format(date, "PPP")}`,
        };
      })
    );
};
