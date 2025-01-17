import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";
import { logReady } from "../../actions/logReady";
import fetchGuild from "../../actions/fetchGuild";

export default function handleReady(client: Client) {
  logReady(client.user.tag);

  client.user.setPresence(generatePresenceData("/help"));

  // Find Off-Nominal Discord Guild, fetch members to prevent partials
  const guild = fetchGuild(client);
  guild.members
    .fetch()
    .catch((err) =>
      console.error("Error fetching partials for Guild Members", err)
    );
}
