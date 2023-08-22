const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } = require('discord.js');
const Util = require('../misc/util.js');
const Data = require('../misc/data.js');
const Format = require('../misc/format.js');

const data = new ContextMenuCommandBuilder()
	.setName('Remove writer')
	.setType(ApplicationCommandType.User)
    .setDMPermission(false);

async function execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ephemeral: true, content: Format.PERMISSION_DENIED});
        return;
    }

    const data = await Data.read(interaction.guildId);
    const targetMember = interaction.guild.members.cache.get(interaction.targetUser.id);
    const role = interaction.guild.roles.cache.find((role => role.id === data.problemWriterRoleId));

    targetMember.roles.remove(role);

    await interaction.reply({ephemeral: true, content: Format.WRITER_REMOVED(interaction.targetUser.id), allowedMentions: { users : [] } });
}

module.exports = { data, execute }