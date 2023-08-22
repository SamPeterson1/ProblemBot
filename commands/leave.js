const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('leave')
	.setDescription('Leave the server and delete all data')
    .setDMPermission(false)

async function execute(interaction) {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({content: Format.LEAVING_SERVER});
        await interaction.guild.leave();
    } else {
        await interaction.reply({content: Format.PERMISSION_DENIED, ephemeral: true});
    }
}

module.exports = { data, execute }