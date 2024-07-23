import { createBot } from '@discordeno/bot'
import { configs } from './config.js'

export const bot = createBot({
  token: configs.token
})
export const user = (await bot.helpers.getUser(bot.id))

export const logger = bot.logger

bot.transformers.desiredProperties.interaction.id = true
bot.transformers.desiredProperties.interaction.type = true
bot.transformers.desiredProperties.interaction.data = true
bot.transformers.desiredProperties.interaction.user = true
bot.transformers.desiredProperties.interaction.member = true
bot.transformers.desiredProperties.interaction.token = true
bot.transformers.desiredProperties.interaction.message = true
bot.transformers.desiredProperties.interaction.guildId = true
bot.transformers.desiredProperties.interaction.channelId = true

bot.transformers.desiredProperties.channel.id = true

bot.transformers.desiredProperties.member.id = true

bot.transformers.desiredProperties.guild.id = true
bot.transformers.desiredProperties.guild.name = true

bot.transformers.desiredProperties.user.id = true
bot.transformers.desiredProperties.user.username = true