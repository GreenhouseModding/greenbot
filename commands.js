const { REST, Routes } = require('discord.js');
const { token, clientId, eventsGuildId, testGuildId } = require('./config.json');

const rest = new REST().setToken(token);

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Separate commands into separate guilds.
// Allowing for global and specific commands.
const globalCommands = [];
const eventsCommands = [];
const testCommands = [];

for (const folder of commandFolders) {
	const folderPath = path.join(foldersPath, folder);
    const innerFolders = fs.readdirSync(folderPath);

    for (const innerFolder of innerFolders) {
        var commands;
        switch (folder) {
            case 'global': 
                commands = globalCommands
                break;
            case 'events': 
                commands = eventsCommands
                break;
            default: 
                commands = testCommands
                break;
        }
        registerCommands(path.join(folderPath, innerFolder), commands)
    }
}

function registerCommands(commandsPath, commands) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

(async () => {
	try {
        const commandLength = globalCommands.length + eventsCommands.length + testCommands.length;
		console.log(`Started refreshing ${commandLength} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const globalData = await rest.put(
            Routes.applicationCommands(clientId),
			{ body: globalCommands },
		);
        const eventsData = await rest.put(
			Routes.applicationGuildCommands(clientId, eventsGuildId),
			{ body: eventsCommands },
		);
        const testData = await rest.put(
			Routes.applicationGuildCommands(clientId, testGuildId),
			{ body: testCommands },
		);

        const dataLength = globalData.length + eventsData.length + testData.length;

		console.log(`Successfully reloaded ${dataLength} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();