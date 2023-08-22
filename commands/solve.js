const { SlashCommandBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('solve')
	.setDescription('Attempt to solve a problem')
    .setDMPermission(false)
    .addIntegerOption(option => option
		.setName('problem-number')
		.setDescription('The number of the problem to solve')
		.setRequired(true)
		.setMinValue(1))
    .addIntegerOption(option => option
        .setName('answer')
        .setDescription('The answer to the problem')
        .setRequired(true));

async function validateAnswer(interaction, data, problem, answer) {
    if (answer !== problem.answer) {
        var numAttempts = 0;

        for (var i = 0; i < problem.attempts.length; i ++) {
            const attempt = problem.attempts[i];

            if (attempt.userId === interaction.user.id)
                numAttempts = ++attempt.count;
        }

        if (numAttempts === 0) {
            problem.attempts.push({userId: interaction.user.id, count: 1});
            numAttempts = 1;
        }

        await Data.write(interaction.guild.id, data);
        await interaction.reply({content: Format.SOLVE_INCORRECT(numAttempts), ephemeral: true});

        return false;
    }

    if (problem.id === data.latestReleaseId) {
        const role = interaction.guild.roles.cache.find((role => role.id === data.solvedRoleId));
        interaction.member.roles.add(role);
    }

    const userId = interaction.user.id;

    if (Util.hasAlreadySolved(problem, userId)) {
        await interaction.reply({content: Format.ALREADY_SOLVED, ephemeral: true});
        return false;
    }

    if (Util.hasViewedSolution(problem, userId)) {
        await interaction.reply({content: Format.VIEWED_SOLUTION, ephemeral: true});
        return false;
    }

    if (!problem.active) {
        await interaction.reply({content: Format.PROBLEM_EXPIRED, ephemeral: true});
        return false;
    }

    return true;
}

async function checkAnswer(interaction, data, problem, answer) {
    if (!await validateAnswer(interaction, data, problem, answer))
        return false;
    
    const userId = interaction.user.id;
    var userEntry = null;

    for (var j = 0; j < data.leaderboard.length; j ++) {
        if (data.leaderboard[j].userId === userId)
            userEntry = data.leaderboard[j];
    }

    if (userEntry === null) {
        userEntry = {userId: userId, solved: []};
        data.leaderboard.push(userEntry);
    }

    userEntry.solved.push(problem.id);

    problem.solvedBy.push({userId: userId, date: new Date()});

    return true;
}

async function execute(interaction) {
	const data = await Data.read(interaction.guild.id);

	const problem = await Util.getProblemFromInteraction(interaction, data);

	if (problem === null)
		return;

	const answer = interaction.options.getInteger('answer');

    if (await checkAnswer(interaction, data, problem, answer)) {
        await Data.write(interaction.guild.id, data);
        await interaction.reply({content: Format.SOLVE_CORRECT, ephemeral: true});
    }
}

module.exports = { data, execute }