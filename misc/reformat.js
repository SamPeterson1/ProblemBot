const foo = async() => {
    const Data = require('./data.js');

const data = await Data.read('1126301769719349258');

for (var i = 0; i < data.leaderboard.length; i ++) {
    const leaderboardEntry = data.leaderboard[i];
    const userId = leaderboardEntry.userId;
    leaderboardEntry.solved = [];

    for (var j = 0; j < data.problems.length; j ++) {
        const problem = data.problems[j];
        for (var k = 0; k < problem.solvedBy.length; k ++) {
            if (problem.solvedBy[k].userId === userId)
                leaderboardEntry.solved.push(problem.id);
        }
    }
}

await Data.write('1126301769719349258', data);
}

foo();