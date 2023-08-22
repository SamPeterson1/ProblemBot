const { EmbedBuilder } = require("@discordjs/builders");

module.exports = {
    asTwoDigits(num) {
        return ('0' + num).slice(-2);
    },

    subtractHours(date, hours) {
        newDate = new Date(date);
	    newDate.setHours(date.getHours() - hours);
        return newDate;
    },

    formatDay(date) {
	    newDate = this.subtractHours(date, 5);
        return `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`;
    },
    
    formatTime(date) {
	    newDate = this.subtractHours(date, 5);
        var hours = newDate.getHours();
        var suffix = 'AM';
    
        if (hours >= 12) {
            if (hours !== 12) hours -= 12;
            suffix = 'PM';
        }
    
        return `${hours}:${this.asTwoDigits(newDate.getMinutes())}:${this.asTwoDigits(newDate.getSeconds())} ${suffix}`;
    },

    getProblem(data, id) {
        for (var i = 0; i < data.problems.length; i ++) {
            if (data.problems[i].released && data.problems[i].id === id)
                return data.problems[i];
        }

        return null;
    },

    getNumAttempts(problem, userId) {
        for (var i = 0; i < problem.attempts.length; i ++) {
            if (problem.attempts[i].userId === userId)
                return problem.attempts[i].count;
        }

        return 0;
    },

    getProblemPowerPoints(problem) {
        return problem.points - Math.min(3, Math.max(0, Math.log(problem.solvedBy.length)));
    },

    getUserPoints(data, leaderboardEntry) {    
        var points = 0;  

        const userId = leaderboardEntry.userId;
        
        for (var i = 0; i < leaderboardEntry.solved.length; i ++) {
            const problem = this.getProblem(data, leaderboardEntry.solved[i]);
            const attempts = this.getNumAttempts(problem, userId);
            const powerPoints = this.getProblemPowerPoints(problem);

            var problemPoints = Math.pow(0.6, attempts) * powerPoints;

            if (this.hasViewedHint(problem, userId))
                problemPoints *= 0.5;

            points += problemPoints;
        }

        return points;
    },

    roundHundreths(num) {
        return Math.round(num * 100) / 100;
    },

    hasViewedSolution(problem, userId) {
        for (var i = 0; i < problem.solutionViewers.length; i ++) {
            var viewerId = problem.solutionViewers[i];

            if (viewerId === userId)
                return true;
        }

        return false;
    },

    hasViewedHint(problem, userId) {
        for (var i = 0; i < problem.hintViewers.length; i ++) {
            var viewerId = problem.hintViewers[i];

            if (viewerId === userId)
                return true;
        }

        return false;
    },

    hasAlreadySolved(problem, userId) {
        for (var i = 0; i < problem.solvedBy.length; i ++) {
            var solver = problem.solvedBy[i];
    
            if (solver.userId === userId)
                return true;
        }
    
        return false;
    },

    getProblemMessage(problem, data, mention = false) {
        const title = `Problem ${problem.id}: ${problem.name} (${problem.points}pts)`;

        var footer = 'Always accepts answers';

        if (problem.expires) {
            const expirationDate = new Date(problem.expirationDate);
            footer = `Accepts answers until ${this.formatDay(expirationDate)} at ${this.formatTime(expirationDate)}`;
        }

        const embed =  new EmbedBuilder()
            .setTitle(title)
            .setImage(problem.problem)
            .setFooter({text: footer});

        return {
            content: mention ? `<@&${data.potwRoleId}>` : '',
            embeds: [embed],
        };
    },

    async getProblemFromInteraction(interaction, data) {
        const problemId = interaction.options.getInteger('problem-number');
        const problem = this.getProblem(data, problemId);

        if (problem === null)
            await interaction.reply('Problem does not exist.');

        return problem;
    },

    async authorizeRoot(interaction) {
        if (interaction.user.id !== process.env.ROOT_USER) {
            await interaction.reply('You are not authorized to use this command.');
            
            return false;
        }
    
        return true;
    },
    
    async authorize(interaction, data) {
        const authorId = interaction.user.id;
    
        for (var i = 0; i < data.authorizedUsers.length; i ++) {
            if (authorId === data.authorizedUsers[i])
                return true;
        }
    
        if (await authorizeRoot(interaction)) 
            return true;
    
        await interaction.reply('You are not authorized to use this command.');
    
        return false;
    },
}
