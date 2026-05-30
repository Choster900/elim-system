import { prisma } from '../database/prisma'

export default defineNitroPlugin(async () => {
    try {
        await prisma.$connect()
        console.log('[db] Connection established successfully')
    } catch (error) {
        console.error('[db] Failed to connect to the database')
        console.error(error)
        process.exit(1)
    }
})
