import Database from 'better-sqlite3'
import { bot, logger } from '../bot.js'
import { closestStartOfDay } from './time.js'
import { operatableGuilds } from '../config.js'

const db = new Database('./db/bans.db')

export async function createBanDb() {
    db.exec('CREATE TABLE IF NOT EXISTS list (UserId TEXT PRIMARY KEY, UnbanTime TEXT NOT NULL, Reason TEXT NOT NULL)') 
}

export async function recordBan(userId: bigint, duration: number, reason: string) {
    const unbanTime = closestStartOfDay(Date.now() + duration)
    createBanDb()
    await db.exec(`INSERT INTO list(userid, unbantime, reason) VALUES ('${userId}', '${unbanTime}', '${reason}') ON CONFLICT(userid) DO UPDATE SET unbantime = '${unbanTime}', reason = '${reason}'`)
    logger.info(`Successfully recorded ban of user ${userId} into db/bans.db.`)
}

export async function unbanExpiredBans() {
    logger.info(`Attempting to unban users...`)
    const currentTime = closestStartOfDay(Date.now())

    const usersToUnbanStatement = db.prepare(`SELECT userid FROM list WHERE CAST(unbantime AS BIGINT) <= ?`)
    const toUnban = usersToUnbanStatement.all(currentTime)

    let totalUnbanned = 0
    for (const value of toUnban) {
        if (!isUnbannable(value)) {
            logger.error('Specified user to unban is incorrectly typed, this should not happen. (Skipping).')
            continue
        }
        const unbannable = value as Unbannable
        logger.info(`Attempting to unban user: ${unbannable.UserId}...`)

        let successes = 0
        for (const guildId of operatableGuilds) {
            try {
                await bot.helpers.unbanMember(guildId, unbannable.UserId, "GreenBot ban duration has expired.")
                ++successes
            } catch (error) {
                const guild = await bot.helpers.getGuild(guildId)
                logger.warn(`Could not unban user ${unbannable.UserId} from guild ${guild.name}`)
                continue
            }
        }
        if (successes > 0) {
            logger.info(`Unbanned user ${unbannable.UserId} as their GreenBot ban has expired.`)
            ++totalUnbanned
        }
    }
    db.prepare(`DELETE FROM list WHERE CAST(unbantime AS BIGINT) <= ?`).run(currentTime)
    logger.info(`Successfuly unbanned ${totalUnbanned} user(s).`)
}

function isUnbannable(obj: any): obj is Unbannable {
    return typeof obj.UserId === 'string'
}

interface Unbannable {
    UserId: string
}