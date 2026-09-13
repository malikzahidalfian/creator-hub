export const TEXT_MODEL = 'gpt-5.5';

// Keep the creative generators responsive; short classification requests override this with none.
export const TEXT_CHAT_OPTIONS = { model: TEXT_MODEL, reasoning_effort: 'low' };

// Image model ID listed by 1inference; GPT-5.5 supplies the visual brief.
export const IMAGE_MODEL = 'venice-gpt-image-1.5';
export const GPT_IMAGE_WORKFLOW = 'gpt-5.5-image';
