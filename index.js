require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { DateTime } = require('luxon')

let startTime = null
let channel = null
let shuttingDown = false

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

async function sendShutdownMessage(customMessage) {
  const endTime = DateTime.now().setZone('America/New_York')
  const startStr = startTime ? startTime.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ') : 'unknown'
  const endStr = endTime.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ')

  const diff = endTime.diff(startTime, ['hours', 'minutes', 'seconds']).toObject()
  const hours = Math.floor(diff.hours)
  const minutes = Math.floor(diff.minutes)
  const seconds = Math.floor(diff.seconds)
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`

  const message = `${customMessage || 'The Raspberry Pi has been shutdown.'}
Bot start time: ${startStr}
Bot end time: ${endStr}
Total uptime: ${uptimeStr}`

  try {
    if (!channel) {
      channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    }
    await channel.send(message)
    await new Promise(res => setTimeout(res, 500))
  } catch (err) {
    console.warn('Failed to send shutdown message:', err.message)
  }
}

client.once('ready', async () => {
  startTime = DateTime.now().setZone('America/New_York')
  console.log(`Bot online as ${client.user.tag} at ${startTime.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ')}`)

  client.user.setPresence({
    activities: [{ name: 'Monitoring A Raspberry Pi', type: 0 }],
    status: 'online'
  })

  try {
    channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    if (channel) {
      await channel.send(`Raspberry Pi is online.\nStart time: ${startTime.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ')}`)
    }
  } catch (err) {
    console.warn('Failed to send startup message:', err.message)
  }
})

const shutdownSignals = ['SIGTERM', 'SIGQUIT', 'SIGINT']

shutdownSignals.forEach(signal => {
  process.on(signal, async () => {
    if (shuttingDown) return
    shuttingDown = true

    console.log(`Received ${signal}, shutting down...`)

    client.user?.setPresence({
      activities: [{ name: 'Maintenance', type: 0 }],
      status: 'dnd'
    })

    const msg = (signal === 'SIGTERM' || signal === 'SIGINT')
      ? 'Maintenance mode: Bot has been stopped manually.'
      : 'The Raspberry Pi has been shut down.'

    await sendShutdownMessage(msg)

    client.destroy()
    process.exit(0)
  })
})

client.login(process.env.DISCORD_TOKEN)