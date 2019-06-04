import { ctxTree } from './context'
import { commands, markup } from './markup'
import { papyrus } from './papyrus'

ctxTree.insert({
  command: commands.START,
  keyboard: markup.initialKeyboard(),
  papyrus: name => papyrus.getInitialGreeting(name),
})
ctxTree.insert(
  {
    command: commands.BEGIN,
    keyboard: markup.chooseAfterStart(),
    papyrus: papyrus.getQuestionAfterStart(),
  },
  commands.START,
)
ctxTree.insert(
  {
    command: commands.FEEDBACK_CONFIRM,
    keyboard: [],
    papyrus: papyrus.getAskPhone(),
  },
  commands.BEGIN,
)
ctxTree.insert(
  {
    command: commands.ASK_NAME,
    keyboard: [],
    papyrus: papyrus.getAskName(),
  },
  commands.START,
)
ctxTree.insert(
  {
    command: commands.SUCCESS_FEEDBACK,
    keyboard: markup.initialKeyboard(),
    papyrus: papyrus.getSuccessFeedback(),
  },
  commands.BEGIN,
)
ctxTree.insert(
  {
    command: commands.CONSULTATION,
    keyboard: markup.chooseQuestion(),
    papyrus: papyrus.getSections(),
  },
  commands.BEGIN,
)
ctxTree.insert(
  {
    command: commands.CAPABILITIES,
    keyboard: markup.goBack(),
    papyrus: papyrus.getCapabilities(),
  },
  commands.CONSULTATION,
)
ctxTree.insert(
  {
    command: commands.CONTACTS,
    keyboard: markup.confirmFeedback(),
    papyrus: papyrus.getContacts(),
  },
  commands.CONSULTATION,
)
ctxTree.insert(
  {
    command: commands.PRICES_AND_DEADLINES,
    keyboard: markup.goBack(),
    papyrus: papyrus.getPricesAndDeadlines(),
  },
  commands.CONSULTATION,
)
ctxTree.insert(
  {
    command: commands.ASK_QUESTION,
    keyboard: markup.goBack(),
    papyrus: papyrus.getAskQuestion(),
  },
  commands.CONSULTATION,
)
ctxTree.insert(
  {
    command: commands.CUSTOM_QUESTION,
    keyboard: markup.initialKeyboard(),
    papyrus: papyrus.getCustomQuestion(),
  },
  commands.CONSULTATION,
)

export const contextTree = ctxTree
