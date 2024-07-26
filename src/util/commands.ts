import { Collection, CreateApplicationCommand, Interaction } from "@discordeno/bot";

export const allCommands = new Collection<string, Command>()
export const globalCommands = new Collection<string, Command>()
export const moddingCommands = new Collection<string, Command>()
export const testCommands = new Collection<string, Command>()


export function createGlobalCommand(command: Command): void {
    globalCommands.set(command.command.name, command)
}

export function createModdingCommand(command: Command): void {
    moddingCommands.set(command.command.name, command)
}

export function createTestCommand(command: Command): void {
    testCommands.set(command.command.name, command)
}

export async function createAllCommandMap() : Promise<void> {
    mergeCollections(globalCommands, allCommands)
    mergeCollections(moddingCommands, allCommands)
    mergeCollections(testCommands, allCommands)
}

function mergeCollections<K, V>(collection: Collection<K, V>, mergeInto: Collection<K, V>) {
    collection.forEach((val, key) => {
        if (mergeInto.has(key))
            return
        mergeInto.set(key, val);
    })
}

export interface Command {
    command: CreateApplicationCommand,
    execute: (interaction: Interaction, args: Record<string, unknown>) => unknown
}