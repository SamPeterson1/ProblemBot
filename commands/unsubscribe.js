const { SlashCommandBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('unsubscribe')
	.setDescription('Unsubscribe from weekly POTW notifications')
    .setDMPermission(false);

async function execute(interaction, potwRoleId) {
    const data = await Data.read(interaction.guildId);

    const role = interaction.guild.roles.cache.find((role => role.id === data.potwRoleId));
    interaction.member.roles.remove(role);
    
    await interaction.reply(Format.UNSUBSCRIBED);
}

module.exports = { data, execute }