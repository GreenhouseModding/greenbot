import ms from 'ms'

import { ApplicationCommandOptionTypes } from '@discordeno/types'
import { createEmbeds, CreateGuildBan, Guild, Interaction, Member, User } from '@discordeno/bot'
import { createTestCommand } from '../../../util/commands.js'
import { bot, logger } from '../../../bot.js'
import { operatableGuilds } from '../../../config.js'

const permaAliases = [ "perma", "permaban" ]

createTestCommand({
    command: {
        name: 'globalban',
        description: 'Bans a target user across all Greenhouse Team ran Discord servers.',
        defaultMemberPermissions: ["BAN_MEMBERS"],
        options: [
            {
                name: 'user',
                description: 'The target user to ban.',
                type: ApplicationCommandOptionTypes.User,
                required: true
            },
            {
                name: 'duration',
                description: 'The duration of the ban. (Examples: 12h, 7d, 28d, 1y)',
                type: ApplicationCommandOptionTypes.String,
                required: true
            },
            {
                name: 'reason',
                description: 'The reason for the ban.',
                type: ApplicationCommandOptionTypes.String,
                required: true
            },
            {
                name: 'delete_until',
                description: 'The duration to delete all messages before. Has a maximum of 7 days. (Examples: 1d, 4d, 7d)',
                type: ApplicationCommandOptionTypes.String,
                required: false
            }
        ]
    },
    execute: async function (interaction: Interaction, args: Record<string, unknown>) {
        await interaction.defer(true)
        
        const interactionMember = interaction.member
        if (!interactionMember) {
            interaction.respond(`Cannot ban a user without a member behind the ban.`)
            return
        }
        
        const { user, duration, delete_until, reason } = args as { user: {user: User, member?: Member}; duration: string; delete_until?: string; reason: string  }

        for (var guildId of operatableGuilds) {
            if (await !hasPermissions(interaction, guildId, interactionMember as Member, user.user.id))
                return
        }

        var deleteUntil = 0
        if (delete_until)
            deleteUntil = ms(delete_until) / 1000
        
        if (deleteUntil > ms('7d') / 1000) {
            await interaction.respond(
                `Cannot delete all of a user's messages as far back as more than 7 days/1 week.`,
                { isPrivate: true } 
            )
        }

        const durString = permaAliases.some(alias => duration.toLocaleLowerCase() === alias) ? 'permanently' : `for ${ms(ms(duration), { long: true })}`

        const guildBan = { deleteMessageSeconds: deleteUntil }
        const dmChannel = await interaction.bot.helpers.getDmChannel(user.user.id)

        if (!dmChannel)
            await banMember(interaction, user.user, guildBan, reason, true)
        
        await interaction.bot.helpers.sendMessage(dmChannel.id, { embeds: createEmbeds()
            .setColor('#2ecc71')
            .setAuthor('Greenhouse Team Discords', { icon_url: 'https://cdn.modrinth.com/data/bkcXk7FA/65e7e57a455c533d38cab64119291903d40c9ebd.png' })
            .setTitle(`You have been banned from the Greenhouse Team Discords ${durString}.`)
            .setDescription(`Reason Specified: ${reason}`)
            .addField('Ban Appeal Forum', 'You may request an appeal through [this link.](https://www.youtube.com/watch?v=dQw4w9WgXcQ)')
            .validate()
        })
        await banMember(interaction, user.user, guildBan, reason, false)
    }
})

async function banMember(interaction: Interaction, user: User, guildBan: CreateGuildBan, reason: string, failedDm: boolean) {
    // TODO: Add user to a database, implement automatic unbans with it in mind.
    for (var guildId of operatableGuilds)
        await interaction.bot.helpers.banMember(guildId, user.id, guildBan, reason)

    var message = `Successfully banned user ${user.username}
    \nFor reason: ${reason}`
    if (failedDm) {
        message = message + `\nFailed to DM user about this ban.`
    }

    await interaction.respond(
        message,
        { isPrivate: true }
    )
}

async function hasPermissions(interaction: Interaction, guildId: bigint, sender: Member, userId: bigint) : Promise<boolean> {
    if (userId == interaction.bot.id) {
        await interaction.respond(
            `I cannot ban myself.`,
            { isPrivate: true }
        )
        return false
    }
    
    var target
    try {
        target = await interaction.bot.helpers.getMember(guildId, userId)
    } catch (error) {
        return true
    }

    var botMember 
    try {
        botMember = await interaction.bot.helpers.getMember(guildId, interaction.bot.id)
    } catch (error) {
        return true
    }

    var guild
    try {
        guild = await interaction.bot.helpers.getGuild(guildId)
    } catch (error) {
        bot.logger.error(`Could not find target guild ${guildId}.`)
        await interaction.respond(
            `Could not find target guild. This should not happen!
            \nPlease report this to a developer of the bot.`,
            { isPrivate: true }
        )
        return false
    }

    const targetPermissions = getMaxRolePosition(target, guild)
    const senderPermissions = getMaxRolePosition(sender, guild)
    const botPermissions = getMaxRolePosition(botMember, guild)

    if (targetPermissions >= senderPermissions) {
        await interaction.respond(
            `Cannot ban a user with the same or higher permissions in guild ${guild.name}.`,
            { isPrivate: true }
        )
        return false
    }
    if (targetPermissions >= botPermissions) {
        await interaction.respond(
            `Cannot ban a user with the same or higher permissions than the bot in guild ${guild.name}.`,
            { isPrivate: true }
        )
        return false
    }

    return true
}

function getMaxRolePosition(target: Member, guild: Guild) : number {
    if (!target.roles)
        return 0
    return Math.max(...target.roles.map(roleId => {
        const role = guild.roles.get(roleId)
        if (!role)
            return 0
        return role.position
    }))
}