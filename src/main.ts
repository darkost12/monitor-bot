import { dirname } from '@discordx/importer'
import { config as envConfig } from 'dotenv'
import type { Interaction } from 'discord.js'
import { IntentsBitField, ChannelType, ActivityType, TextChannel } from 'discord.js'
import { Client } from 'discordx'
import { createServer } from 'http'
import * as child from 'child_process';

const bot = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages
  ],
  silent: false
})

bot.once('ready', async () => {
  await bot.initApplicationCommands()

  console.log('Bot started')
})

bot.on('interactionCreate', (interaction: Interaction) => {
  bot.executeInteraction(interaction)
})

bot.rest.on('restDebug', message => {
  if (message.includes('429 rate limit')) {
    console.log('Rate limit hit at ' + (new Date()).toTimeString())
    // Your handler
  }
})

const psAndPost = (channel: TextChannel) => {
  const logPath = dirname(import.meta.url) + '/../shared/log'

  child.exec(
    `cat ${logPath}`,
    (err, stdout, _stderr) => {
      if (err) {
        channel.send(err.message)
      } else if (stdout !== '') {
        channel.send("```" + stdout + "```")
      }

      return
    }
  )
}

async function run() {
  envConfig({ path: dirname(import.meta.url) + '/../shared/.env' })

  if (process.env.BOT_TOKEN && process.env.CHANNEL_ID) {
    await bot.login(process.env.BOT_TOKEN)
    const channel = await bot.channels.fetch(process.env.CHANNEL_ID);

    if (channel && channel.type === ChannelType.GuildText) {
      psAndPost(channel)
      setInterval(function () {
        psAndPost(channel)
      }, 6 * 3600 * 1000);
    }

    bot.user?.setActivity('running containers', { type: ActivityType.Watching })

    createServer((_, res) => res.end('Bot is alive!')).listen(3000)
  } else {
    throw Error('Could not find BOT_TOKEN')
  }
}

run()
