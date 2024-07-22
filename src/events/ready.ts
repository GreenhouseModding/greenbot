import { bot } from '../bot.js'

bot.events.ready = async ({ user, shardId }) => {
    if (shardId === bot.gateway.lastShardId) {
        bot.logger.info(`Successfully connected to the gateway as ${user.username}`)
    }
}