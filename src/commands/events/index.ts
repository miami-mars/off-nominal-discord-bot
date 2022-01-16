import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Work with Discord Events")
    .addSubcommand((command) =>
      command
        .setName("start")
        .setDescription("Start a new event in #livechat")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription(
              "The url where anomalies can watch or listen to the event"
            )
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("How long should the event last (in minutes)?")
            .setRequired(true)
            .setMaxValue(180)
            .setMinValue(30)
        )
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("Title of the event")
            .setRequired(true)
        )
    ),
].map((command) => command.toJSON());

export default commands;