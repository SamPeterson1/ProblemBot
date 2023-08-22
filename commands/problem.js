const { SlashCommandBuilder, PermissionsBitField, FormattingPatterns } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('problem')
    .setDescription('Add or remove a problem')
    .setDMPermission(false)
    .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a new problem')
        .addStringOption(option => option
            .setName('release-date')
            .setDescription('the problem release date (YYYY-MM-DD)')
            .setRequired(true))
        .addIntegerOption(option => option
            .setName('points')
            .setDescription('the point value of the problem')
            .setMinValue(1)
            .setRequired(true))
        .addIntegerOption(option => option
            .setName('problem-number')
            .setDescription('the problem number to add')
            .setRequired(true)
            .setMinValue(1))
        .addStringOption(option => option
            .setName('title')
            .setDescription('the title of the problem')
            .setRequired(true))
        .addIntegerOption(option => option
            .setName('answer')
            .setDescription('the answer to the problem')
            .setRequired(true))
        .addAttachmentOption(option => option
            .setName('problem')
            .setDescription('the problem statement (image)')
            .setRequired(true))
        .addAttachmentOption(option => option
            .setName('solution')
            .setDescription('the full solution (image)')
            .setRequired(true))
        .addAttachmentOption(option => option
            .setName('hint')
            .setDescription('the problem hint (image)')
            .setRequired(false))
        .addStringOption(option => option
            .setName('expiration-date')
            .setDescription('the problem expiration date (YYYY-MM-DD)')
            .setRequired(false)))
    .addSubcommand(subcommand => subcommand
        .setName('remove')
        .setDescription('Remove a problem')
        .addIntegerOption(option => option
            .setName('problem-number')
            .setDescription('the problem number to remove')
            .setRequired(true)
            .setMinValue(1)));

async function addProblem(interaction, data) {
    const problemId = interaction.options.getInteger('problem-number');

    if (Util.getProblem(data, problemId) !== null) {
        await interaction.reply(Format.PROBLEM_EXISTS);
        return;
    }
    
    const hintAttachment = interaction.options.getAttachment('hint')
    const hasHint = (hintAttachment !== null);
    const hintUrl = hasHint ? hintAttachment.url : undefined;

    const expirationDateString = interaction.options.getString('expiration-date');
    const expires = (expirationDateString !== null);
    const expirationDate = expires ? new Date(`${expirationDateString} 17:00 GMT`) : undefined;

    data.problems.push({
        name: interaction.options.getString('title'),
        problem: interaction.options.getAttachment('problem').url,
        solution: interaction.options.getAttachment('solution').url,
        hint: hintUrl,
        hasHint: hasHint,
        id: problemId,
        releaseDate: new Date(`${interaction.options.getString('release-date')} 17:00 GMT`),
        expires: expires,
        expirationDate: expirationDate,
        solvedBy: [],
        solutionViewers: [],
        hintViewers: [],
        attempts: [],
        points: interaction.options.getInteger('points'),
        answer: interaction.options.getInteger('answer'),
        active: false,
        released: false
    });

    await Data.write(interaction.guildId, data);
    await interaction.reply(Format.PROBLEM_ADDED);
}

async function removeProblem(interaction, data) {
    const problemId = interaction.options.getInteger('problem-number');
    var prevLength = data.problems.length;

    data.problems = data.problems.filter((problem) => problem.id !== problemId);

    if (data.problems.length < prevLength) {
        await Data.write(interaction.guildId, data);
        await interaction.reply(Format.PROBLEM_REMOVED);
    } else {
        await interaction.reply(Format.PROBLEM_NOT_FOUND);
    }
}
            
async function execute(interaction) {
    const data = await Data.read(interaction.guildId);
    
    if (!interaction.member.roles.cache.has(data.problemWriterRoleId) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({content: Format.PERMISSION_DENIED, ephemeral: true});
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
        await addProblem(interaction, data);
    } else if (subcommand === 'remove') {
        await removeProblem(interaction, data)
    }

}

module.exports = { data, execute }