export const MODELS = [
  'mistralai/devstral-small-2505:free',
  'openai/gpt-oss-120b:free',
  'moonshotai/kimi-k2:free',
  'qwen/qwen3-coder:free',
  'qwen/qwen3-235b-a22b:free',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  'meta-llama/llama-3.1-405b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free'
] as const

export type FrameworkKey = 'vanilla' | 'react' | 'next' | 'angular' | 'vue'

export const FRAMEWORKS: { key: FrameworkKey; label: string }[] = [
  { key: 'vanilla', label: 'Vanilla JS' },
  { key: 'react', label: 'React' },
  { key: 'next', label: 'Next.js' },
  { key: 'angular', label: 'Angular' },
  { key: 'vue', label: 'Vue' },
]

export const DEFAULT_MODEL = MODELS[0]

// Image-capable or multimodal models to offer for image generation flows
export const IMAGE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen2.5-vl-72b-instruct:free'
] as const

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0]

// Safer fallback models to try automatically if the chosen model fails
export const FALLBACK_MODELS: string[] = [
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-3.1-70b-instruct:free',
  'mistralai/mixtral-8x7b-instruct:free',
  MODELS[0]
]

export const SITE_NAME = 'Xerironx'

// Mode-specific model groupings
export const TEXT_MODELS = MODELS
export const CODE_MODELS = MODELS.filter(m =>
  m.toLowerCase().includes('coder') ||
  m.toLowerCase().includes('oss') ||
  m.toLowerCase().includes('instruct')
)
export const WEB_MODELS = CODE_MODELS

export const DEFAULT_TEXT_MODEL = TEXT_MODELS[0] || DEFAULT_MODEL
export const DEFAULT_CODE_MODEL = CODE_MODELS[0] || DEFAULT_MODEL
export const DEFAULT_WEB_MODEL = WEB_MODELS[0] || DEFAULT_MODEL
