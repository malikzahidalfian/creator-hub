export const TEXT_MODEL = 'gpt-5.5';

// Keep the creative generators responsive; short classification requests override this with none.
export const TEXT_CHAT_OPTIONS = { model: TEXT_MODEL, reasoning_effort: 'low' };
