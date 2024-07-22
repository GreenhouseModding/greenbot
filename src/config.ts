const token = process.env.TOKEN
const moddingGuildId = process.env.MODDING_GUILD_ID
const eventsGuildId = process.env.EVENTS_GUILD_ID
const testGuildId = process.env.TEST_GUILD_ID

if (!token) throw new Error('Missing TOKEN environment variable');
if (!moddingGuildId) throw new Error('Missing MODDING_GUILD_ID environment variable');
if (!eventsGuildId) throw new Error('Missing EVENTS_GUILD_ID environment variable');
if (!testGuildId) throw new Error('Missing TEST_GUILD_ID environment variable');

export const configs: Config = {
    token,
    moddingGuildId: BigInt(moddingGuildId),
    eventsGuildId: BigInt(eventsGuildId),
    testGuildId: BigInt(testGuildId)
}

export const operatableGuilds: Array<bigint> = [ configs.moddingGuildId, configs.eventsGuildId ] 

export interface Config {
    token: string
    moddingGuildId: bigint
    eventsGuildId: bigint
    testGuildId: bigint
}