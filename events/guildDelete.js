const { Events } = require('discord.js');
const Data = require('../misc/data.js');
const { endUpdates } = require('../misc/updateProblems.js');

async function deleteGuild(guildId) {
    var guilds = (await Data.readJSONFile('data/guilds.json')).guilds;
    guilds = guilds.filter((id) => guildId !== id);

    await Data.delete(guildId);

    await Data.writeJSONFile('data/guilds.json', {guilds: guilds});

    endUpdates(guildId);
    
    console.log("Left server " + guildId);
}

async function execute(guild) {
   await deleteGuild(guild.id);
}

module.exports = {name: Events.GuildDelete, execute, deleteGuild};