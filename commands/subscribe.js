const { SlashCommandBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('subscribe')
	.setDescription('Subscribe to weekly POTW notifications');

async function execute(interaction) {
    const data = await Data.read(interaction.guildId);

    const role = interaction.guild.roles.cache.find((role => role.id === data.potwRoleId));
    interaction.member.roles.add(role);

    await interaction.reply(Format.SUBSCRIBED);
}

module.exports = { data, execute }