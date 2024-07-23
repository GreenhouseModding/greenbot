export function closestStartOfDay(input: number) : number {
    return Math.floor(input - input % 86400000)
}