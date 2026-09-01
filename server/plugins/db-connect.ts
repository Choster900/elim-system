import { prisma } from '../database/prisma'

export default defineNitroPlugin(async () => {
    try {
        await prisma.$queryRaw`SELECT 1`
        console.log('[db] Connection established successfully')
    } catch (error) {
        console.error('[db] Failed to connect to the database')
        console.error(error)

        if (process.env.VERCEL !== '1') {
            process.exit(1)
        }
    }
})
