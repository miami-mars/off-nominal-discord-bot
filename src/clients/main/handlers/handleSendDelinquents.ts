import { Message, EmbedBuilder } from "discord.js";
import fetchGuild from "../../actions/fetchGuild";

const WM_ROLE_ID = process.env.WM_ROLE_ID;
const MECO_ROLE_ID = process.env.MECO_ROLE_ID;
const OFN_ROLE_ID = process.env.OFN_ROLE_ID;
const BOT_ROLE_ID = process.env.BOT_ROLE_ID;
const HOST_ROLE_ID = process.env.HOST_ROLE_ID;
const GUEST_ROLE_ID = process.env.GUEST_ROLE_ID;
const MOD_ROLE_ID = process.env.MODS_ROLE_ID;

export default async function handleSendDelinquents(message: Message) {
  const guild = fetchGuild(message.client);
  const guildMemberManager = guild.members;

  const author = await guildMemberManager.fetch(message.author.id);
  if (!author.roles.cache.has(MOD_ROLE_ID)) {
    return;
  }

  // Gather Data
  const totalUserCount = guildMemberManager.cache.size;
  const allUsers = await guildMemberManager.list({ limit: 1000 });

  const delinquents = allUsers.filter((member) => {
    const roleChecks = [
      member.roles.cache.has(WM_ROLE_ID),
      member.roles.cache.has(MECO_ROLE_ID),
      member.roles.cache.has(OFN_ROLE_ID),
      member.roles.cache.has(BOT_ROLE_ID),
      member.roles.cache.has(HOST_ROLE_ID),
      member.roles.cache.has(GUEST_ROLE_ID),
    ];
    return !roleChecks.includes(true);
  });

  const embed = new EmbedBuilder({
    title: "Delinquents",
    description:
      "These are the members who do not have requisite roles in Discord.",
    fields: [
      {
        name: "Total",
        value: `${delinquents.size} deliquent users of ${totalUserCount} total users`,
      },
      {
        name: "List",
        value: delinquents.map((user) => user.displayName).join("\n"),
      },
    ],
  });

  const channel = await author.createDM();
  channel.send({ embeds: [embed] });
}
