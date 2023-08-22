const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const Data = require('../misc/data.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('releaseto')
    .setDescription('Set the channel problems will be released to')
    .setDMPermission(false)
    .addChannelOption(option => option
        .setName('release-channel')
        .addChannelTypes(ChannelType.GuildText)
        .setDescription('The channel that problems will be released to')
        .setRequired(true))
    

async function execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ephemeral: true, content: Format.PERMISSION_DENIED});
        return;
    }

    const data = await Data.read(interaction.guild.id);
    
    data.potwChannelId = interaction.options.getChannel('release-channel').id;

    await Data.write(interaction.guild.id, data);
    await interaction.reply(Format.RELEASE_CHANNEL_SET);
}

module.exports = { data, execute }