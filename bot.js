var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var characters = require('./characters.json');
var skills = require('./skills.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            // Just add any case commands if you want to..
			case 'roll':
				if(!args[0]) {
					bot.sendMessage({
						to: channelID,
						message: 'Please specify an attribute to roll against'
					});
					break;
				}
				args[0] = args[0].toLowerCase();
				var character = characters[user];
				if(!character) {
					bot.sendMessage({
						to: channelID,
						message: 'Character not defined for username ' + user
					});
					break;
				}
				var dice = character[args[0]];
				if(!dice) {
					bot.sendMessage({ 
						to: channelID,
						message: 'Attribute not found for argument ' + args[0]
					});
					break;
				}
				if(args.length > 1) {
					var overrideDice = args[1];
					if(!/[+-]{0,}\d{1,}/.test(overrideDice)) {
						bot.sendMessage({
							to: channelID,
							message: 'Invalid override argument, ' + args[1]
						});
						break;
					}
					if(overrideDice[0] == '+') {
						dice += parseInt(overrideDice.substring(1))
					} else if(overrideDice[0] == '-') {
						dice -= parseInt(overrideDice.substring(1))
						if(dice < 1) dice = 1;
					} else {
						dice = parseInt(overrideDice);
					}
				}
				var message = 'Rolling ' + dice + ' ' + args[0] + ' dice... `';
				var diceResults = [];
				for(var i = 0; i < dice; i++) {
					var roll = Math.floor(Math.random() * 6) + 1;
					message += roll + ', ';
					diceResults.push(roll);
				}
				message +='`';
				bot.sendMessage({
					to: channelID,
					message: message
				});
				var successes = diceResults.filter(function(num) { return num == 6; }).length;
				bot.sendMessage({
					to: channelID,
					message: 'You rolled ' + successes + ' success - you ' + (successes > 0 ? 'passed!' : 'failed.')
				});
				if(skills[args[0]]) {
					if(successes > 0 && skills[args[0]].question.length > 0) {
						bot.sendMessage({
							to: channelID,
							message: 'You may now ask two of the following:\r\n-' + skills[args[0]].question.join('\r\n-')
						});
					}
					if(successes > 1) {
						bot.sendMessage({
							to: channelID,
							message: 'With your extra ' + (successes - 1) + ' success(es), you can:\r\n-' + skills[args[0]].bonus.join('\r\n-')
						});
					}
				}
         }
     }
});