require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

let channel = null
let shuttingDown = false

async function sendShutdownMessage() {
  if (shuttingDown || !channel) return
  shuttingDown = true

  try {
    await channel.send('Raspberry Pi is offline.')
  } catch (err) {
    console.warn('Failed to send shutdown message:', err.message)
  }
}

client.once('ready', async () => {
  console.log(`Bot online as ${client.user.tag}`)

  client.user.setPresence({
    activities: [{ name: 'Running On A Raspberry Pi', type: 0 }],
    status: 'online'
  })

  try {
    channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    if (channel) {
      await channel.send('Raspberry Pi is online.')
    }
  } catch (err) {
    console.warn('Failed to send startup message:', err.message)
  }
})

const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT']

shutdownSignals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`)
    await sendShutdownMessage()
    process.exit(0)
  })
})

client.login(process.env.DISCORD_TOKEN)