const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');
const { create } = require('../misc/data.js');

const data = new SlashCommandBuilder()
	.setName('leaderboard')
    .setDescription('View either the global leaderboard or a problem leaderboard')
    .setDMPermission(false)
    .addSubcommand(subcommand => subcommand
        .setName('problem')
        .setDescription('View the leaderboard for a specific problem')
        .addIntegerOption(option => option
            .setName('problem-number')
            .setDescription('The number of the problem to view')
            .setRequired(true)
            .setMinValue(1))
            .addIntegerOption(option => option
                .setName('page-length')
                .setDescription('The number of entries to display on one page')
                .setRequired(false)
                .setMinValue(1))
            .addIntegerOption(option => option
                .setName('page')
                .setDescription('The page to display')
                .setRequired(false)
                .setMinValue(1)))
    .addSubcommand(subcommand => subcommand
        .setName('global')
        .setDescription('View the global leaderboard')
        .addIntegerOption(option => option
            .setName('page-length')
            .setDescription('The number of entries to display on one page')
            .setRequired(false)
            .setMinValue(1))
        .addIntegerOption(option => option
            .setName('page')
            .setDescription('The page to display')
            .setRequired(false)
            .setMinValue(1)));

async function getGlobalLeaderboard(data, page, pageLength) {
    data.leaderboard.sort((a, b) => Util.getUserPoints(data, b) - Util.getUserPoints(data, a));

    var text = '';

    for (var i = (page - 1) * pageLength; i < Math.min(page * pageLength, data.leaderboard.length); i ++) {
        const leaderboardEntry = data.leaderboard[i];
        const userId = leaderboardEntry.userId;
        const points = Util.getUserPoints(data, leaderboardEntry);

        var record = '';

        for (var j = 0; j < data.problems.length; j ++) {
            const problem = data.problems[i];
            const hasSolved = Util.hasAlreadySolved(problem, userId);

            if (hasSolved)
                record += `✓ `;
            else if (problem.active)
                record += `- `;
            else
                record += `x `;
        }

        text += Format.GLOBAL_LEADERBOARD_ENTRY(i + 1, userId, Util.roundHundreths(points), leaderboardEntry.solved.length, record);
    }

    const numPages = Math.ceil(data.leaderboard.length / pageLength);

    if (page > numPages)
        return null;

    const buttonRow = buildButtonRow(page > 1, page < numPages);

    return { content: text, components: [buttonRow], allowedMentions: { users : [] } , ephemeral: true, fetchReply: true };
}

async function getProblemLeaderboard(problem, page, pageLength) {
    problem.solvedBy.sort((a, b) => b.pointsEarned - a.pointsEarned);
    
    var content = Format.LEADERBOARD_PAGE_HEADER(page);

    for (var i = (page - 1) * pageLength; i < Math.min(page * pageLength, problem.solvedBy.length); i ++) {
        const solver = problem.solvedBy[i];
        const solveDate = new Date(solver.date);

        content += Format.PROBLEM_LEADERBOARD_ENTRY(i + 1, solver.userId, Util.formatDay(solveDate), Util.formatTime(solveDate));
    }

    const numPages = Math.ceil(problem.solvedBy.length / pageLength);

    if (page > numPages) 
        return null;

    const buttonRow = buildButtonRow(page > 1, page < numPages);

    return { content: content, components: [buttonRow], allowedMentions: { users : [] } , ephemeral: true, fetchReply: true };
}

function buildButtonRow(hasPrev, hasNext) {
    const rowBuilder = new ActionRowBuilder();

    const prev = new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Previous Page')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasPrev);

    const next = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next Page')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasNext);

    return new ActionRowBuilder()
        .addComponents(prev, next);
}

function createCollector(interaction, message, getUpdate) {
    const collectorFilter = i => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter: collectorFilter, time: 60000 });

    collector.on('collect', async (interaction) => {
        console.log(interaction.customId);
            if (interaction.customId === 'prev') {
            const newMessage = await interaction.update(await getUpdate(-1));
            createCollector(interaction, newMessage, getUpdate);
            collector.stop();
        } else if (interaction.customId === 'next') {
            const newMessage = await interaction.update(await getUpdate(1));
            createCollector(interaction, newMessage, getUpdate);
            collector.stop();
        }
    })
}

async function execute(interaction) {
    const data = await Data.read(interaction.guildId);

    const subcommand = interaction.options.getSubcommand();
    var page = interaction.options.getInteger('page');
    var pageLength = interaction.options.getInteger('page-length');

    if (pageLength === null) 
        pageLength = 10;

    if (page === null) {
        page = 1;
    }

    if (subcommand === 'problem') {
        const problem = await Util.getProblemFromInteraction(interaction, data);
	    
        if (problem === null)
		    return;

        const leaderboard = await getProblemLeaderboard(problem, page, pageLength);

        if (leaderboard === null) {
            await interaction.reply({ content: Format.LEADERBOARD_PAGE_UNDEFINED, ephemeral: true });
        } else {
            const message = await interaction.reply(leaderboard);

            createCollector(interaction, message, async (pageDelta) => { page += pageDelta; return await getProblemLeaderboard(problem, page, pageLength)});
        }
    } else if (subcommand === 'global') {
        const leaderboard = await getGlobalLeaderboard(data, page, pageLength);

        if (leaderboard === null) {
            await interaction.reply({ content: Format.LEADERBOARD_PAGE_UNDEFINED, ephemeral: true });
        } else {
            const message = await interaction.reply(leaderboard);

            createCollector(interaction, message, async (pageDelta) => { page += pageDelta; return await getGlobalLeaderboard(data, page, pageLength)});
        }
    }
}

module.exports = { data, execute }