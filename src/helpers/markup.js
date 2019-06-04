export const commands = {
  BEGIN: '/begin',
  START: '/start',
  ASK_NAME: '/ask_name',
  CUSTOM_QUESTION: '/custom_question',
  SUCCESS_FEEDBACK: '/success_feedback',
  CONVERSATION_STARTED: '/conversation_started',
  CONSULTATION: 'Получить консультацию',
  FEEDBACK_CONFIRM: 'Оставить заявку',
  CAPABILITIES: 'Возможности',
  PRICES_AND_DEADLINES: 'Цены/Сроки',
  CONTACTS: 'Контакты',
  GO_BACK: 'Вернуться назад',
  ASK_QUESTION: 'Задать вопрос',
}

export const markup = {
  initialKeyboard: () => [['/begin']],
  chooseAfterStart: () => [['Оставить заявку'], ['Получить консультацию']],
  chooseQuestion: () => [['Возможности'], ['Цены/Сроки'], ['Контакты'], ['Задать вопрос']],
  confirmFeedback: () => [['Оставить заявку'], ['Вернуться назад']],
  goBack: () => [['Вернуться назад']],
}
