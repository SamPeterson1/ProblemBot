const Data = require('./data.js');
const Util = require('./util.js');

const callbackIds = {};

function retire(problem) {
    problem.released = true;
    problem.active = false;
}

async function release(problem, data, guild, client) {
	if (data.potwChannelId === undefined)
        return;

	const role = guild.roles.cache.find((role => role.id === data.solvedRoleId));

	await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions,
        mentionable: role.mentionable
    }).then(role => data.solvedRoleId = role.id);

    role.delete();

    const channel = client.channels.cache.get(data.potwChannelId);
    await channel.send(Util.getProblemMessage(problem, data, true));

    problem.active = true;
    problem.released = true;
    data.latestReleaseId = problem.id;
}

async function updateProblems(guild, client) {
	const data = await Data.read(guild.id);

	const date = new Date();
	var updated = false;

	for (var i = 0; i < data.problems.length; i ++) {
		const problem = data.problems[i];

		const releaseDate = new Date(problem.releaseDate);

		if (problem.expires) {
			const expirationDate = new Date(problem.expirationDate);

			if (date > expirationDate) {
				if (problem.active) {
					retire(problem);
					updated = true;
				}
			} else if (date > releaseDate) {
				if (!problem.active) {
					await release(problem, data, guild, client);
					updated = true;
				}
			}
		} else if (date > releaseDate && !problem.active) {
			await release(problem, data, guild, client);
			updated = true;
		}
	}

	if(updated)
		await Data.write(guild.id, data);
}

function beginUpdates(guildId, client) {
	const guild = client.guilds.cache.get(guildId);
	callbackIds[guild.id] = setInterval(updateProblems, 60000, guild, client);
}

function endUpdates(guildId) {
	clearInterval(callbackIds[guildId]);
	delete callbackIds[guildId];
}

module.exports = {beginUpdates, endUpdates}