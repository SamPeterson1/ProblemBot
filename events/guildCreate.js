const { Events } = require('discord.js');
const Data = require('../misc/data.js');
const { beginUpdates } = require('../misc/updateProblems.js');

var client;

function setClient(c) {
    client = c;
}

async function execute(guild) {
    const guilds = (await Data.readJSONFile('data/guilds.json')).guilds;

    var exists = false;

    for (var i = 0; i < guilds.length; i ++) {
        if (guilds[i].id === guild.id) {
            exists = true;
            break;
        }
    }

    if (!exists) {
        guilds.push(guild.id);
        await Data.writeJSONFile('data/guilds.json', {guilds: guilds});
    }

    await Data.create(guild.id);

    const data = {
        authorizedUsers: [],
        leaderboard: [],
        problems: []
    };

    await guild.roles.create({
        name: 'Problem Notifications',
        color: '#8700b0',
        reason: 'Allows users to subscibe to problem notifications'
    }).then((role) => data.potwRoleId = role.id);

    await guild.roles.create({
        name: 'Problem Solvers',
        color: '#0dfc00',
        reason: 'Distinguishes users who have solved the most recent problem'
    }).then((role) => data.solvedRoleId = role.id);

    await guild.roles.create({
        name: 'Problem Writers',
        color: '#0dfc00',
        reason: 'Allows users to write and delete problems'
    }).then((role) => data.problemWriterRoleId = role.id);

    console.log(data.solvedRoleId);
    await Data.write(guild.id, data);
    
    beginUpdates(guilds[i], client);
    console.log("Joined server " + guilds[i]);
}

module.exports = {name: Events.GuildCreate, execute, setClient};