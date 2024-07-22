import 'dotenv/config'

import { configs } from './config.js'
import { bot, logger } from './bot.js'
import { allCommands, globalCommands, moddingCommands, eventsCommands, testCommands, createAllCommandMap } from './util/commands.js'
import importDirectory from './util/loader.js'

logger.info(`Upserting GreenBot commands!`)
await importDirectory('./dist/commands')
await updateAppCommands()
await createAllCommandMap()
logger.info(`Successfully upserted ${allCommands.size} GreenBot commands!`)
await bot.shutdown()
process.exit(0)

async function updateAppCommands() : Promise<void> {
    await bot.helpers.upsertGlobalApplicationCommands(globalCommands.map((value) => value.command))
    await bot.helpers.upsertGuildApplicationCommands(configs.moddingGuildId, moddingCommands.map((value) => value.command))
    await bot.helpers.upsertGuildApplicationCommands(configs.eventsGuildId, eventsCommands.map((value) => value.command))
    await bot.helpers.upsertGuildApplicationCommands(configs.testGuildId, testCommands.map((value) => value.command))
}