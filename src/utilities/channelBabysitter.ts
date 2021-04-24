import { Client, TextChannel } from "discord.js";
import { parseCommands } from "../helpers/parseCommands";

const timeoutPeriod = Number(process.env.LIVECHAT_TIMEOUT_SECS) || 15;

const formatTime = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);

  return `${m} minutes`;
};

const requestNotification =
  "Request received! If you don't see the update right away, note that Discord limits the channel update API to 2 changes per 10 minutes. Either wait it out or ask a mod to change it manually.";

const generateInactivityMessage = (timeout: number) => {
  return `It's been ${formatTime(
    timeout
  )} since the last message. Sounds like the live event is done, so I've cleared the channel topic.`;
};

const generateTopicMessage = (options?: { desc: string[]; url: string }) => {
  if (options) {
    return `🔴 Live - ${options.desc.join(" ")}\n\n${options.url}`;
  } else {
    return "⚫ Not Currently Live\n|\nWhen we're watching a live event, this is the channel we watch and interact with. If you want to listen along and participate, jump in!\n\nSet me using the command `!topic [STREAM_URL] [DESCRIPTION]` like `!topic https://youtu.be/dQw4w9WgXcQ Rocket Launch!`";
  }
};

export class ChannelBabysitter {
  private _timer: NodeJS.Timer;
  private _isTiming: boolean = false;
  private _client: Client;
  private _channelId: string;
  private _timeoutPeriod: number = timeoutPeriod * 1000;

  constructor(client: Client, channelId: string) {
    this._client = client;
    this._channelId = channelId;

    this._client.on("message", async (message) => {
      const isCorrectChannel = message.channel.id === this._channelId;
      const [prefix, url, ...desc] = parseCommands(message, false);

      if (prefix === "!topic" && isCorrectChannel) {
        await message.channel.send(requestNotification);
        const msg =
          url === "reset"
            ? generateTopicMessage()
            : generateTopicMessage({ desc, url });
        this.setTopic(message.channel as TextChannel, msg);
      }

      if (this._isTiming && isCorrectChannel) {
        this.resetTimer(message.channel as TextChannel);
      }
    });

    this._client.on(
      "channelUpdate",
      (oldChannel: TextChannel, newChannel: TextChannel) => {
        const eventIsHappening = !newChannel.topic.includes("⚫");
        const topicHasChanged = oldChannel.topic !== newChannel.topic;
        const isCorrectChannel = newChannel.id === this._channelId;

        if (
          topicHasChanged &&
          !this._isTiming &&
          eventIsHappening &&
          isCorrectChannel
        ) {
          this.startTimer(newChannel);
        }
      }
    );
  }

  //Timer Functions

  public startTimer(channel: TextChannel) {
    this._timer = setTimeout(() => {
      this.handleInactivity(channel);
    }, this._timeoutPeriod);

    this._isTiming = true;
  }

  public clearTimer() {
    clearTimeout(this._timer);
    this._isTiming = false;
  }

  public resetTimer(channel: TextChannel) {
    clearTimeout(this._timer);
    this.startTimer(channel);
  }

  // Topic Setting

  public async setTopic(channel: TextChannel, text: string) {
    try {
      await channel.setTopic(text);
    } catch (err) {
      console.error(err);
    }
  }

  //Inactivity handler

  public async handleInactivity(channel: TextChannel) {
    this.setTopic(channel, generateTopicMessage());

    try {
      await channel.send(generateInactivityMessage(this._timeoutPeriod));
      this.clearTimer();
    } catch (err) {
      console.error(err);
    }
  }
}
