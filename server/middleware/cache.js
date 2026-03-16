import { createClient } from 'redis'
import ora from 'ora'


const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

client.on('error', err => console.log('Redis Client Error', err))

const spinner = ora('Connecting to Redis...').start()

try {
    await client.connect()
    spinner.succeed('Connected to Redis')
} catch (err) {
    spinner.fail('Failed to connect to Redis')
    console.error(err)
}

export default client