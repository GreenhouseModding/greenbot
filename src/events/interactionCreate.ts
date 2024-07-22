import { commandOptionsParser, InteractionTypes } from '@discordeno/bot'
import { bot } from '../bot.js'
import { allCommands } from '../util/commands.js';

bot.events.interactionCreate = async ( interaction ) => {
    if (!interaction.token || !interaction.data || interaction.type !== InteractionTypes.ApplicationCommand) {
        bot.logger.error(`Interaction token, command data is not present or interaction type is not an application command.`)
        return
    }

    const command = allCommands.get(interaction.data.name)

    if (!command) {
        bot.logger.error(`Command ${interaction.data.name} not found.`)
        return
    }

    try {
        const options = commandOptionsParser(interaction)
        await command.execute(interaction, options)
    } catch (error) {
        const e = error as Error
        bot.logger.error(`There was an exception whilst executing the ${command.command.name} command.\n${e.stack}`)
        await interaction.respond(`There was an exception whilst executing the ${command.command.name} command.
            \nPlease report this to a developer of the bot.
            \n${e.message}`, { isPrivate: true} )
    }
}