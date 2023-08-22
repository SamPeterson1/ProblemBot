const { Events } = require('discord.js');
const Data = require('../misc/data.js');
const { beginUpdates } = require('../misc/updateProblems.js');
const GuildCreate = require('./guildCreate.js');
const GuildDelete = require('./guildDelete.js');

async function execute(client) {
	GuildCreate.setClient(client);
	
	console.log(`Ready! Logged in as ${client.user.tag}`);
	const guilds = client.guilds.cache.map(guild => guild.id);
	const registeredGuilds = (await Data.readJSONFile('data/guilds.json')).guilds;

	for (var i = 0; i < registeredGuilds.length; i ++) {
		var isJoined = false;
		for (var j = 0; j < guilds.length; j ++) {
			if (registeredGuilds[i] === guilds[j])
				isJoined = true;
		}

		if (!isJoined)
			await GuildDelete.deleteGuild(registeredGuilds[i]);
	}

    for (var i = 0; i < guilds.length; i ++) {
		var isRegistered = false;
		for (var j = 0; j < registeredGuilds.length; j ++) {
			if (guilds[i] === registeredGuilds[j])
				isRegistered = true;
		}

		console.log("On server " + guilds[i]);

		if (!isRegistered) 
			await GuildCreate.execute(client.guilds.cache.get(guilds[i]));
		else
			beginUpdates(guilds[i], client);	
    }
}

module.exports = {name: Events.ClientReady, once: true, execute};
