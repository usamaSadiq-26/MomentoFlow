import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const task = await prisma.task.findFirst({
            where: { title: { contains: 'SALARY' } },
            include: {
                comments: true,
                createdBy: true
            }
        })
        console.log('Task found:', JSON.stringify(task, null, 2))
    } catch (error) {
        console.error('Database error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
