import 'dotenv/config'

import { allCommands, createAllCommandMap } from './util/commands.js'
import importDirectory from './util/loader.js'
import { bot, logger } from './bot.js'

logger.info(`Starting GreenBot...`)

logger.info(`Loading GreenBot commands!`)
await importDirectory('./dist/commands')
await createAllCommandMap()
logger.info(`Successfully loaded ${allCommands.size} GreenBot commands!`)

logger.info(`Loading GreenBot events!`)
await importDirectory('./dist/events')
logger.info(`Successfully loaded GreenBot events!`)

await bot.start()