const { SlashCommandBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('leaderboard')
    .setDescription('View either the global leaderboard or a problem leaderboard')
    .addSubcommand(subcommand => subcommand
        .setName('problem')
        .setDescription('View the leaderboard for a specific problem')
        .addIntegerOption(option => option
            .setName('problem-number')
            .setDescription('The number of the problem to view')
            .setRequired(true)
            .setMinValue(1))
        .addIntegerOption(option => option
            .setName('length')
            .setDescription('The number of entries to display')
            .setRequired(false)
            .setMinValue(1)))
    .addSubcommand(subcommand => subcommand
        .setName('global')
        .setDescription('View the global leaderboard')
        .addIntegerOption(option => option
            .setName('length')
            .setDescription('The number of entries to display')
            .setRequired(false)
            .setMinValue(1)));

async function showGlobalLeaderboard(interaction, data, maxLength) {
    data.leaderboard.sort((a, b) => b.points - a.points);

    var content = "";

    for (var i = 0; i < Math.min(maxLength, data.leaderboard.length); i ++) {
        const user = data.leaderboard[i];

        content += Format.GLOBAL_LEADERBOARD_ENTRY(i + 1, user.userId, user.points, user.solved);
    }

    if (data.leaderboard.length > maxLength)
        content += Format.LEADERBOARD_CONTINUED(data.leaderboard.length - maxLength);

    if (content === '')
        content = Format.GLOBAL_LEADERBOARD_EMPTY;

    await interaction.reply({ content: content, allowedMentions: { users : [] } });
}

async function showProblemLeaderboard(interaction, problem, maxLength) {
    problem.solvedBy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    var content = '';

    for (var i = 0; i < Math.min(maxLength, problem.solvedBy.length); i ++) {
        const solver = problem.solvedBy[i];
        const solveDate = new Date(solver.date);

        content += Format.PROBLEM_LEADERBOARD_ENTRY(i + 1, solver.userId, Util.formatDay(solveDate), Util.formatTime(solveDate));
    }

    if (problem.solvedBy.length > maxLength)
        content += Format.LEADERBOARD_CONTINUED(problem.solvedBy.length - maxLength);

    if (content === '')
        content = Format.PROBLEM_LEADERBOARD_EMPTY;

    await interaction.reply({ content: content, allowedMentions: { users : [] } });
}

async function execute(interaction) {
    const data = await Data.read(interaction.guildId);

    const subcommand = interaction.options.getSubcommand();
    var maxLength = interaction.options.getInteger('length');

    if (maxLength === null) 
        maxLength = 10;

    if (subcommand === 'problem') {
        const problem = await Util.getProblemFromInteraction(interaction, data);
	    
        if (problem === null)
		    return;

        await showProblemLeaderboard(interaction, problem, maxLength);
    } else if (subcommand === 'global') {
        await showGlobalLeaderboard(interaction, data, maxLength);
    }
}

module.exports = { data, execute }