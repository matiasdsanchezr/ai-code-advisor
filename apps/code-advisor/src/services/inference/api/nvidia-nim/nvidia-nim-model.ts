import z from "zod"

export const NvidiaNimModelEnum = z.enum([
  "deepseek-ai/deepseek-v3.1",
  "deepseek-ai/deepseek-v3.1-terminus",
  "deepseek-ai/deepseek-v3.2",
  "google/gemma-4-31b-it",
  "mistralai/mistral-large-3-675b-instruct-2512",
  "minimaxai/minimax-m2.5",
  "minimaxai/minimax-m2.7",
  "moonshotai/kimi-k2.5",
  "nvidia/nemotron-3-super-120b-a12b",
  "qwen/qwen3.5-122b-a10b",
  "qwen/qwen3.5-397b-a17b",
  "qwen/qwen3-coder-480b-a35b-instruct",
  "stepfun-ai/step-3.5-flash",
  "z-ai/glm4.7",
  "z-ai/glm5",
])
