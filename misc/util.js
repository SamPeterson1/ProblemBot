const { EmbedBuilder } = require("@discordjs/builders");

module.exports = {
    asTwoDigits(num) {
        return ('0' + num).slice(-2);
    },

    formatDay(date) {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    },
    
    formatTime(date) {
        var hours = date.getHours();
        var suffix = 'AM';
    
        if (hours >= 12) {
            if (hours !== 12) hours -= 12;
            suffix = 'PM';
        }
    
        return `${hours}:${this.asTwoDigits(date.getMinutes())}:${this.asTwoDigits(date.getSeconds())} ${suffix}`;
    },

    getProblem(data, id) {
        for (var i = 0; i < data.problems.length; i ++) {
            if (data.problems[i].released && data.problems[i].id === id)
                return data.problems[i];
        }

        return null;
    },

    hasViewedSolution(problem, userId) {
        for (var i = 0; i < problem.solutionViewers.length; i ++) {
            var viewerId = problem.solutionViewers[i];

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
