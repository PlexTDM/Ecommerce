import { createClient } from 'redis'


const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

client.on('error', err => console.log('Redis Client Error', err))

await client.connect()
const result = await client.get('foo')
if (result) console.log('connected to Redis')

export default client