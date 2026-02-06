import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const lastTask = await prisma.task.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                comments: true,
                createdBy: true
            }
        })
        console.log('Last Task:', JSON.stringify(lastTask, null, 2))
    } catch (error) {
        console.error('Database error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
