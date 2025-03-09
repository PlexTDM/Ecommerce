import { createClient } from 'redis'

const client = createClient({
    username: 'default',
    password: 'F6lcPYK3cg0huLC8KYSbrVFvwBPTheOF',
    socket: {
        host: 'redis-17851.c83.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 17851
    }
})

client.on('error', err => console.log('Redis Client Error', err))

await client.connect()
const result = await client.get('foo')
if (result) console.log('connected to Redis')

export default client