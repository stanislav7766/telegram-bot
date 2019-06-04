import Telegraf from 'telegraf'
import Markup from 'telegraf/markup'
import dotenv from 'dotenv'
import {
  papyrus,
  commands,
  context,
  validation,
  definiteLoggerLevel,
  responsesCollection,
} from './helpers'

dotenv.config()

const PORT = process.env.APP_PORT
const bot = new Telegraf(process.env.BOT_ACCOUNT_TOKEN)
const keyboard = (...args) =>
  Markup.keyboard(...args)
    .oneTime()
    .resize()
    .extra()

try {
  bot.telegram.setWebhook(process.env.EXPOSE_URL)
  bot.startWebhook('/', null, PORT)
} catch (err) {
  definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  bot.deleteWebhook()
}

bot.start(async ctx => {
  try {
    const reply = (...args) => ctx.reply(...args)

    responsesCollection.has(commands.START) &&
      responsesCollection.get(commands.START)(ctx, commands.START, reply, keyboard)
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
})

bot.on('message', async ctx => {
  const reply = (...args) => ctx.reply(...args)

  const { text } = ctx.message
  if (responsesCollection.has(text)) responsesCollection.get(text)(ctx, text, reply, keyboard)
  else if (validation.isCorrectPhone(text))
    responsesCollection.has(commands.SUCCESS_FEEDBACK) &&
      responsesCollection.get(commands.SUCCESS_FEEDBACK)(ctx, text, reply, keyboard)
  else if (validation.isName(text, context.getContext()))
    responsesCollection.has(commands.INITIAL) &&
      responsesCollection.get(commands.INITIAL)(ctx, text, reply, keyboard)
  else if (validation.isCustomQuestion(text, context.getContext(), context.getPhone()))
    responsesCollection.has(commands.CUSTOM_QUESTION) &&
      responsesCollection.get(commands.CUSTOM_QUESTION)(ctx, text, reply, keyboard)
  else reply(papyrus.getNotValidData())
})

bot.catch(err => definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical'))
bot.launch()
