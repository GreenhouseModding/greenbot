import Database from 'better-sqlite3'
import { bot, logger } from '../bot.js'
import { closestStartOfDay } from './time.js'
import { configs } from '../config.js'

const db = new Database('./db/bans.db')

export async function createBanDb() {
    db.exec('CREATE TABLE IF NOT EXISTS List (UserId TEXT PRIMARY KEY, UnbanTime TEXT NOT NULL, Reason TEXT NOT NULL)') 
}

export async function recordBan(userId: bigint, duration: number, reason: string) {
    const unbanTime = duration == -1 ? -1 : closestStartOfDay(Date.now() + duration)
    createBanDb()
    await db.exec(`INSERT INTO list(userid, unbantime, reason) VALUES ('${userId}', '${unbanTime}', '${reason}') ON CONFLICT(userid) DO UPDATE SET unbantime = '${unbanTime}', reason = '${reason}'`)
    logger.info(`Successfully recorded ban of user ${userId} into db/bans.db.`)
}

export async function unbanExpiredBans() {
    logger.info(`Attempting to unban users...`)
    const currentTime = closestStartOfDay(Date.now())

    const usersToUnbanStatement = db.prepare(`SELECT userid FROM list WHERE CAST(unbantime AS BIGINT) <= ? AND CAST(unbantime AS BIGINT) != -1`)
    const toUnban = usersToUnbanStatement.all(currentTime)

    let totalUnbanned = 0
    for (const value of toUnban) {
        if (!isUnbannable(value)) {
            logger.error('Specified user to unban is incorrectly typed, this should not happen. (Skipping).')
            continue
        }
        const unbannable = value as Unbannable
        logger.info(`Attempting to unban user: ${unbannable.UserId}...`)

        try {
            await bot.helpers.unbanMember(configs.moddingGuildId, unbannable.UserId, "GreenBot ban duration has expired.")
            logger.info(`Unbanned user ${unbannable.UserId} as their GreenBot ban has expired.`)
            ++totalUnbanned
         } catch (error) {
            logger.warn(`Failed to unban user ${unbannable.UserId} from Greenhouse Modding.`)
        }
    }
    db.prepare(`DELETE FROM list WHERE CAST(unbantime AS BIGINT) <= ? AND CAST(unbantime AS BIGINT) != -1`).run(currentTime)
    logger.info(`Successfuly unbanned ${totalUnbanned} user(s).`)
}

function isUnbannable(obj: any): obj is Unbannable {
    return typeof obj.UserId === 'string'
}

interface Unbannable {
    UserId: string
}