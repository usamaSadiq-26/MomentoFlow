import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const tasks = await prisma.task.findMany({
            where: { title: { contains: 'SALARY' } },
            include: {
                comments: true
            }
        })
        tasks.forEach(t => {
            console.log(`Task: ${t.title}, ID: ${t.id}, Comments: ${t.comments.length}`)
            t.comments.forEach(c => console.log(` - Comment: ${c.content}`))
        })
    } catch (error) {
        console.error('Database error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
