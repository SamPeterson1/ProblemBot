import DiscordJS, { Partials, EmbedBuilder, Client, GatewayIntentBits, ChannelType } from 'discord.js'
import { readFile, writeFile } from 'node:fs/promises'
import dotenv from 'dotenv'

dotenv.config()

var problems;
var leaderboard;
var activeProblems = [];
var promiseQueue = [];

const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
	],
    partials: [
        Partials.Channel
    ]
})

function asTwoDigits(num) {
    return ('0' + num).slice(-2);
}

function addToPromiseQueue(promiseFunc) {
    var promise;

	if (promiseQueue.length > 0) {
		var prevRequest = promiseQueue[promiseQueue.length - 1];

		promise = prevRequest.then(() => {
			return promiseFunc();
		})
	} else {
		promise = promiseFunc();
	}

	promiseQueue.push(promise);

	promise.then(() => {
		promiseQueue.shift();
	});

	return promise;
}

function readJSON(fileName) {
    return addToPromiseQueue(() => {
        return readFile(fileName, {encoding: 'utf-8'}).then((contents) => JSON.parse(contents))
    });
}

function writeJSON(fileName, json) {
    return addToPromiseQueue(() => {
        return writeFile(fileName, JSON.stringify(json, null, "\t"), {encoding: 'utf-8'});
    });
}

function setTimeoutInterval(f, timeout) {
    setTimeout(() => {f(); setTimeoutInterval(f, timeout)}, timeout);
}

function updateProblems() {
    const date = new Date();

    for (var i = 0; i < problems.length; i ++) {
        const problem = problems[i];

        const releaseDate = new Date(problem.releaseDate);

        if (problem.expires) {
            const expirationDate = new Date(problem.expirationDate);

            if (date > expirationDate) {
                if (problem.active) retire(problem);
            } else if (date > releaseDate) {
                if (!problem.active) release(problem);
            }
        } else if (date > releaseDate && !problem.active) {
            release(problem);
        }

    }
}

function hasAlreadySolved(problem, userId) {
    for (var i = 0; i < problem.solvedBy.length; i ++) {
        var solver = problem.solvedBy[i];

        if (solver.userId === userId)
            return true;
    }

    return false;
}

function hasViewedSolution(problem, userId) {
    for (var i = 0; i < problem.solutionViewers.length; i ++) {
        var viewerId = problem.solutionViewers[i];

        if (viewerId === userId)
            return true;
    }

    return false;
}

function checkAnswer(message, problemId, answer) {
    const problem = getProblemByID(problemId);

    if (problem === null) {
        message.reply({content: "Problem does not exist."});
        return;
    }

    if (answer === problem.answer) {
        const id = message.author.id;
        const alreadySolved = hasAlreadySolved(problem, id);
        const viewedSolution = hasViewedSolution(problem, id);

        if (!alreadySolved && !viewedSolution) {
            if (problem.active) {
                message.reply({content: `Correct answer! You earned ${problem.points} points!`});
                
                var userEntry = null;

                for (var j = 0; j < leaderboard.length; j ++) {
                    if (leaderboard[j].userId === message.author.id)
                        userEntry = leaderboard[j];
                }

                if (userEntry === null) {
                    userEntry = {userId: message.author.id, points: 0, solved: 0};
                    leaderboard.push(userEntry);
                }

                userEntry.points += problem.points;
                userEntry.solved ++;

                writeJSON('leaderboard.json', leaderboard);

                problem.solvedBy.push({userId: message.author.id, date: new Date()});

                writeJSON('problems.json', problems);
            } else {
                message.reply({content: "Correct answer! However, you earned no points because the problem no longer accepts answers."})
            }
        } else if (alreadySolved) {
            message.reply({content: "Correct answer! However, you earned no points because you have already solved this problem."});
        } else if (viewedSolution) {
            message.reply({content: "Correct answer! However, you earned no points because you have viewed the solution or hint."});
        }
    } else {
        message.reply({content: "Incorrect answer."});
    }
}

function retire(problem) {
    problem.released = true;
    problem.active = false;

    activeProblems.filter((testProblem) => {
        return testProblem !== problem
    });

    writeJSON('problems.json', problems);
}

function release(problem) {
    console.log("released: " + problem.name);
    const channel = client.channels.cache.get('1037943367365046343');
    channel.send(getProblemMessage(problem));

    problem.active = true;
    problem.released = true;
    writeJSON('problems.json', problems);
}

function getProblemByID(id) {
    for (var i = 0; i < problems.length; i ++) {
        if (problems[i].released && problems[i].id === id)
            return problems[i];
    }

    return null;
}

function formatDay(date) {
    return `${date.getMonth()}/${date.getDay()}/${date.getFullYear()}`;
}

function formatTime(date) {
    var hours = date.getHours();
    var suffix = 'AM';

    if (hours > 12) {
        hours -= 12;
        suffix = 'PM';
    }

    return `${hours}:${asTwoDigits(date.getMinutes())}:${asTwoDigits(date.getSeconds())} ${suffix}`;
}

async function showLeaderboard(message) {
    var content = "";

    for (var i = 0; i < leaderboard.length; i ++) {
        const user = leaderboard[i];
        const username = (await client.users.fetch(user.userId)).toString();
    
        content += `${username} has ${user.points} points with ${user.solved} problem(s) solved\n`;    
    }

    message.reply({content: content, allowedMentions: { users : []} });
}

async function showInfo(message, problemId) {
    const problem = getProblemByID(problemId);

    if (problem === null) {
        message.reply({content: "Problem does not exist."});
        return;
    }

    var info = "";

    for (var j = 0; j < problem.solvedBy.length; j ++) {
        const solver = problem.solvedBy[j];
        const solverName = (await client.users.fetch(solver.userId)).toString();
        const solveDate = new Date(solver.date);

        info += `Solved by ${solverName} on ${formatDay(solveDate)} at ${formatTime(solveDate)}\n`;
    }

    message.reply({content: info, allowedMentions: { users : []} });
}

function getProblemMessage(problem) {
    const title = `Problem ${problem.id}: ${problem.name} (${problem.points}pts)`;

    const attachment = new DiscordJS.AttachmentBuilder(`problems/problem${problem.id}.jpeg`, {name: `problem${problem.id}.jpeg`});
    const image = `attachment://problem${problem.id}.jpeg`;
    var footer = 'Always accepts answers';

    if (problem.expires) {
        const expirationDate = new Date(problem.expirationDate);
        footer = `Accepts answers until: ${formatDay(expirationDate)} at ${formatTime(expirationDate)}`;
    }

    const embed =  new DiscordJS.EmbedBuilder()
        .setTitle(title)
        .setImage(image)
        .setFooter({text: footer});

    return {
        embeds: [embed],
        files: [attachment],
    };
}

function showSolution(message, problemId) {
    const problem = getProblemByID(problemId);

    if (problem === null) {
        message.reply("Problem does not exist.");
    } else {
        problem.solutionViewers.push(message.author.id);
        writeJSON('problems.json', problems);

        message.reply({files: [`solutions/problem${problemId}.jpeg`]});
    }
}

function showHint(message, problemId) {
    const problem = getProblemByID(problemId);

    if (problem === null) {
        message.reply("Problem does not exist.");
    } else if (problem.hasHint) {
        problem.solutionViewers.push(message.author.id);
        writeJSON('problems.json', problems);

        message.reply({files: [`hints/problem${problemId}.jpeg`]});
    } else {
        message.reply({content: "Problem has no hint."});
    }
}

function showProblemWithId(message, problemId) {
    const problem = getProblemByID(problemId);

    if (problem === null) {
        message.reply("Problem does not exist.");
    } else {
        message.reply(getProblemMessage(problem));
    }
}

readJSON('problems.json').then(json => {
    console.log(json)
    problems = json;

    for (var i = 0; i < problems.length; i ++) {
        if (problems[i].active)
            activeProblems.push(problems[i]);
    }

    setTimeoutInterval(updateProblems, 10000);
});

readJSON('leaderboard.json').then(json => { leaderboard = json; });

client.on('ready', () => {
    console.log("whe")
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (msg) => {
    if (!msg.content.startsWith("?"))
        return;

    var tokens = msg.content.split(" ");
    var intArgs = [];

    for (var i = 1; i < tokens.length; i ++) {
        intArgs.push(Number.parseInt(tokens[i]));
    }

    if (tokens[0] === '?solve' && msg.channel.type === ChannelType.DM) {
        if (tokens.length === 3 && !Number.isNaN(intArgs[0]) && !Number.isNaN(intArgs[1])) {
            checkAnswer(msg, intArgs[0], intArgs[1]);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?solve <Problem Number> <Answer>"});
        }
    } else if (tokens[0] === '?info') {
        if (tokens.length === 2 && !Number.isNaN(intArgs[0])) {
            showInfo(msg, intArgs[0]);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?info <Problem Number>"})
        }
    } else if (tokens[0] === '?leaderboard') {
        if (tokens.length === 1) {
            showLeaderboard(msg);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?leaderboard"})
        }
    } else if (tokens[0] === '?problem') {
        if (tokens.length === 2 && !Number.isNaN(intArgs[0])) {
            showProblemWithId(msg, intArgs[0]);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?problem <Problem Number>"})
        }  
    } else if (tokens[0] === '?solution') {
        if (tokens.length === 2 && !Number.isNaN(intArgs[0])) {
            showSolution(msg, intArgs[0]);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?solution <Problem Number>"})
        }
    } else if (tokens[0] === '?hint') {
        if (tokens.length === 2 && !Number.isNaN(intArgs[0])) {
            showHint(msg, intArgs[0]);
        } else {
            msg.reply({content: "Invalid arguments. Correct syntax: ?solution <Problem Number>"})
        }
    } else {
        msg.reply({content: "Unkown command"});
    }
})

client.login(process.env.TOKEN)