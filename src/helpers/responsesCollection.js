import dotenv from 'dotenv'
import axios from 'axios'
import { commands } from './markup'
import { papyrus } from './papyrus'
import { definiteLoggerLevel } from './logger'
import { context } from './context'
import { contextTree } from './contextTree'
import { validation } from './validation'

dotenv.config()
const instance = axios.create({
  baseURL: process.env.API_HOST,
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
})
const errorOnResponse = res => /^[4|5]\d{2,2}$/i.test(res)

const saveRequest = async () => {
  try {
    const user = {
      name: context.getName(),
      phoneNumber: context.getPhone(),
      status: 'new',
    }
    const requestResult = await instance.post('/request', user)
    return requestResult.data
  } catch (err) {
    errorOnResponse(err.response.status) &&
      definiteLoggerLevel(papyrus.getNotifyTechnical(err.response.status), 'telegram_technical')
    return err.response.status
  }
}
const saveQuestion = async () => {
  try {
    const user = {
      name: context.getName(),
      phoneNumber: context.getPhone(),
      question: context.getCustomQuestion(),
      status: 'new',
    }
    const questionResult = await instance.post('/question', user)
    return questionResult.data
  } catch (err) {
    errorOnResponse(err.response.status) &&
      definiteLoggerLevel(papyrus.getNotifyTechnical(err.response.status), 'telegram_technical')
    return err.response.status
  }
}

const TextMessageResponse = async (command, fn, keyboard) => {
  try {
    const ctx = contextTree.getCurrentCtx(command)
    context.emit('changeContext', ctx)
    await fn(ctx.papyrus, keyboard(ctx.keyboard))
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}
const AskQuestionResponse = async (ctxTg, command, fn, keyboard) => {
  try {
    const userName = ctxTg.message.from.first_name
    if (validation.isEmpty(context.getName()) && validation.isCorrectName(userName))
      context.setName(userName)
    let ctx = contextTree.getCurrentCtx(command)
    context.emit('changeContext', ctx)
    ctx =
      (validation.isEmpty(context.getPhone()) &&
        contextTree.getCurrentCtx(commands.FEEDBACK_CONFIRM)) ||
      ctx
    await fn(ctx.papyrus, keyboard(ctx.keyboard))
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}

const CustomQuestionResponse = async (command, cq, fn, keyboard) => {
  try {
    const ctx = contextTree.getCurrentCtx(command)
    context.setCustomQuestion(cq)

    const f1 = () => saveQuestion()
    const f2 = async res => {
      if (errorOnResponse(await res)) fn(papyrus.errorOnSaveQuestion())
      else {
        const questionResult = await res
        questionResult.status === 'ok'
          ? fn(ctx.papyrus, keyboard(ctx.keyboard))
          : fn(questionResult.msg)
      }
    }
    context.emit('changeContext', ctx)
    if (!validation.isEmpty(context.getPhone()))
      f2(f1()) && context.emit('changeContext', contextTree.getCurrentCtx(commands.START))
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}

const SuccessFeedbackResponse = async (ctxTg, command, phone, fn, keyboard) => {
  try {
    validation.isEmpty(context.getPhone()) && context.setPhone(phone)
    const f1 = () => saveRequest()
    const f2 = async res => {
      if (errorOnResponse(await res)) fn(papyrus.errorOnSaveRequest())
      else {
        const requestResult = await res
        requestResult.status === 'ok'
          ? TextMessageResponse(
              context.getContext().command === commands.ASK_QUESTION
                ? commands.ASK_QUESTION
                : command,
              fn,
              keyboard,
            )
          : fn(requestResult.msg)
      }
    }
    const feedback = () =>
      f2(f1()) && context.emit('changeContext', contextTree.getCurrentCtx(commands.START))
    const question = () => TextMessageResponse(commands.ASK_QUESTION, fn, keyboard)
    const another = () => fn(papyrus.getErrorAnotherCtx())

    if (context.getContext().command === commands.FEEDBACK_CONFIRM) feedback()
    else if (context.getContext().command === commands.ASK_QUESTION) question()
    else another()
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}
const ConfirmFeedbackResponse = async (ctxTg, command, fn, keyboard) => {
  try {
    const userName = ctxTg.message.from.first_name
    if (validation.isEmpty(context.getName()) && validation.isCorrectName(userName))
      context.setName(userName)
    const ctx = contextTree.getCurrentCtx(command)
    context.emit('changeContext', ctx)
    validation.isEmpty(context.getPhone())
      ? TextMessageResponse(command, fn, keyboard)
      : SuccessFeedbackResponse(ctxTg, commands.SUCCESS_FEEDBACK, context.getPhone(), fn, keyboard)
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}
const BackResponse = async (fn, keyboard) => {
  try {
    const curCtx = context.getContext()
    let ctx = {}
    if (validation.isEmpty(curCtx.command) || curCtx.command === commands.START) {
      ctx = contextTree.getCurrentCtx(commands.START)
      context.emit('changeContext', ctx)
      fn(papyrus.getInitialIfEmptyCtx(), keyboard(ctx.keyboard))
    } else {
      ctx = contextTree.getParentOfCurContext(curCtx.command)
      await fn(ctx.papyrus, keyboard(ctx.keyboard))
    }
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}

const ConversationStarted = async (ctxTg, fn, keyboard) => {
  try {
    const userName = ctxTg.message.from.first_name
    validation.isCorrectName(userName) && context.setName(userName)

    const ctx = contextTree.getCurrentCtx(
      validation.isCorrectName(userName) ? commands.START : commands.ASK_NAME,
    )
    context.emit('changeContext', ctx)
    validation.isCorrectName(userName)
      ? fn(ctx.papyrus(userName), keyboard(ctx.keyboard))
      : fn(ctx.papyrus)
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}

const InitialResponse = async (ctxTg, name, fn, keyboard) => {
  try {
    const ctx = contextTree.getCurrentCtx(commands.START)
    const f1 = () => context.emit('changeContext', ctx)
    const f2 = () => fn(ctx.papyrus(name), keyboard(ctx.keyboard))

    validation.isEmpty(context.getName())
      ? f2(f1())
      : fn(papyrus.getAlreadyExistName(context.getName()))

    !validation.isCorrectName(ctxTg.message.from.first_name) && context.setName(name)
  } catch (err) {
    definiteLoggerLevel(papyrus.getNotifyErrorBot(err), 'telegram_technical')
  }
}

const responsesCollection = new Map()

responsesCollection.set(commands.START, (ctx, text, fn, keyboard) =>
  ConversationStarted(ctx, fn, keyboard),
)
responsesCollection.set(commands.BEGIN, (ctx, command, fn, keyboard) =>
  TextMessageResponse(command, fn, keyboard),
)
responsesCollection.set(commands.INITIAL, (ctx, name, fn, keyboard) =>
  InitialResponse(ctx, name, fn, keyboard),
)
responsesCollection.set(commands.FEEDBACK_CONFIRM, (ctx, text, fn, keyboard) =>
  ConfirmFeedbackResponse(ctx, text, fn, keyboard),
)
responsesCollection.set(commands.SUCCESS_FEEDBACK, (ctx, phone, fn, keyboard) =>
  SuccessFeedbackResponse(ctx, commands.SUCCESS_FEEDBACK, phone, fn, keyboard),
)
responsesCollection.set(commands.CONSULTATION, (ctx, command, fn, keyboard) =>
  TextMessageResponse(command, fn, keyboard),
)
responsesCollection.set(commands.CAPABILITIES, (ctx, command, fn, keyboard) =>
  TextMessageResponse(command, fn, keyboard),
)
responsesCollection.set(commands.PRICES_AND_DEADLINES, (ctx, command, fn, keyboard) =>
  TextMessageResponse(command, fn, keyboard),
)
responsesCollection.set(commands.CONTACTS, (ctx, command, fn, keyboard) =>
  TextMessageResponse(command, fn, keyboard),
)
responsesCollection.set(commands.ASK_QUESTION, (ctx, command, fn, keyboard) =>
  AskQuestionResponse(ctx, command, fn, keyboard),
)
responsesCollection.set(commands.CUSTOM_QUESTION, (ctx, cq, fn, keyboard) =>
  CustomQuestionResponse(commands.CUSTOM_QUESTION, cq, fn, keyboard),
)
responsesCollection.set(commands.GO_BACK, (ctx, command, fn, keyboard) =>
  BackResponse(fn, keyboard),
)

export { responsesCollection }
