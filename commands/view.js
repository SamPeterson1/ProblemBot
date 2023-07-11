const { SlashCommandBuilder } = require('discord.js');
const Data = require('../misc/data.js');
const Util = require('../misc/util.js');
const Format = require('../misc/format.js');

const data = new SlashCommandBuilder()
	.setName('view')
	.setDescription('View information about a problem')
	.addStringOption(option => option
		.setName('info-type')
		.setDescription('The type of information to view')
		.setRequired(true)
		.addChoices(
			{ name: 'problem', value: 'problem'},
			{ name: 'solution', value: 'solution'},
			{ name: 'hint', value: 'hint'},
		))
	.addIntegerOption(option => option
		.setName('problem-number')
		.setDescription('The number of the problem to view')
		.setRequired(true)
		.setMinValue(1));
		
async function viewProblem(interaction, problem) {
	await interaction.reply(Util.getProblemMessage(problem, false));
}

async function viewSolution(interaction, data, problem) {
	if (!Util.hasViewedSolution(problem, interaction.user.id))
		problem.solutionViewers.push(interaction.user.id);

	await Util.addRole(interaction, data.solvedRoleId);

	await interaction.reply({content: Format.SOLUTION(problem.solution), ephemeral: true});
}

async function viewHint(interaction, problem) {
	if (problem.hasHint) {
		if (!Util.hasViewedSolution(problem, interaction.user.id))
			problem.solutionViewers.push(interaction.user.id);
		
		await interaction.reply({content: Format.HINT(problem.hint), ephemeral: true});
	} else {
		await interaction.reply({content: Format.HINT_UNAVAILABLE, ephemeral: true});
	}
}

async function execute(interaction) {
	const data = await Data.read(interaction.guild.id);

	const problem = await Util.getProblemFromInteraction(interaction, data);
	
	if (problem === null)
		return;

	const infoType = interaction.options.getString('info-type');

	if (infoType === 'problem') 
		await viewProblem(interaction, problem);
	else if (infoType === 'solution')
		await viewSolution(interaction, data, problem)
	else if (infoType === 'hint')
		await viewHint(interaction, problem)

	await Data.write(interaction.guild.id, data);
}

module.exports = { data, execute }