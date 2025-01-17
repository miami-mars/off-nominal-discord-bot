import {
  CommandInteraction,
  GuildMember,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import EventEmitter = require("events");
import createPollEmbed from "../../clients/main/actions/poll/createPollEmbed";
import { StreamHostEvents } from "../../types/eventEnums";
import {
  generatePartyMessages,
  PartyMessage,
  streamTitleEmbed,
  TitleSuggestion,
} from "./partyMessages";

const MS_IN_A_MINUTE = 60000;
const MAX_TITLE_SUGGESTIONS = 36;

export class StreamHost extends EventEmitter {
  private active: boolean;
  private activeEvent: GuildScheduledEvent<GuildScheduledEventStatus.Active> =
    null;
  private partyMessages: PartyMessage[] | null = null;
  private partyMessageTimers: NodeJS.Timeout[] = [];
  private titleSuggestions: TitleSuggestion[] = [];

  constructor() {
    super();
    this.sendPartyMessage = this.sendPartyMessage.bind(this);
    this.startParty = this.startParty.bind(this);
    this.endParty = this.endParty.bind(this);
    this.initiatePartyMessageSchedule =
      this.initiatePartyMessageSchedule.bind(this);
    this.clearMessageTimers = this.clearMessageTimers.bind(this);
    this.logSuggestion = this.logSuggestion.bind(this);
    this.viewSuggestions = this.viewSuggestions.bind(this);
  }

  private sendPartyMessage(
    message: string | MessagePayload | MessageOptions,
    event: GuildScheduledEvent<GuildScheduledEventStatus.Active> = this
      .activeEvent
  ) {
    this.emit(StreamHostEvents.PARTY_MESSAGE, message, event);
  }

  private initiatePartyMessageSchedule() {
    this.partyMessageTimers = this.partyMessages.map((msg) => {
      return setTimeout(() => {
        this.sendPartyMessage(msg.text);
      }, msg.waitTime * MS_IN_A_MINUTE);
    });
  }

  public async startParty(
    event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
  ) {
    if (this.active) {
      return;
    }

    this.active = true;
    this.activeEvent = event;
    this.partyMessages = await generatePartyMessages(event);

    this.initiatePartyMessageSchedule();
    setTimeout(() => {
      this.emit(
        StreamHostEvents.PARTY_MESSAGE,
        { embeds: [streamTitleEmbed] },
        this.activeEvent
      );
    });
  }

  private clearMessageTimers() {
    this.partyMessageTimers.forEach((timer) => clearTimeout(timer));
  }

  public endParty() {
    if (!this.active) {
      return;
    }

    this.emit(
      StreamHostEvents.PARTY_MESSAGE,
      {
        content: "Thanks for hanging out everyone!",
        embeds: [
          createPollEmbed(
            "Vote on your favourite title suggestion",
            this.titleSuggestions.map(
              (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
            )
          ),
        ],
      },
      this.activeEvent
    );

    this.clearMessageTimers();
    this.active = false;
    this.activeEvent = null;
    this.partyMessages = null;
    this.titleSuggestions = [];
  }

  public eventActive() {
    return this.active;
  }

  public async logSuggestion(title: string, interaction: CommandInteraction) {
    if (!this.active) {
      try {
        await interaction.reply({
          content: `This command only works during a live Off-Nominal episode stream.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (this.titleSuggestions.length >= MAX_TITLE_SUGGESTIONS) {
      try {
        await interaction.reply(
          `Actually, I'm not that sophisticated of a bot, and I can only remember like ${MAX_TITLE_SUGGESTIONS} suggestions at a time. If you've reached this point, this is either a really funny episode (not likely), or you're trying to break me (likely) and maybe you should get some new hobbies or something.`
        );
      } catch (err) {
        console.error(err);
      }

      return;
    }

    this.titleSuggestions.push({
      title,
      suggester: interaction.member as GuildMember,
    });

    try {
      await interaction.reply({
        content: `Logged your suggestion of **"${title}"**!\n\nTo view the currently logged suggestions, use \`/events suggestions\``,
      });
    } catch (err) {
      console.error(err);
    }
  }

  public async viewSuggestions(interaction: CommandInteraction) {
    if (!this.active) {
      try {
        await interaction.reply({
          content: `This command only works during a live Off-Nominal episode stream.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }

      return;
    }

    try {
      await interaction.reply({
        embeds: [
          createPollEmbed(
            "Current suggestions so far",
            this.titleSuggestions.map(
              (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
            )
          ),
        ],
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
    }
  }
}
