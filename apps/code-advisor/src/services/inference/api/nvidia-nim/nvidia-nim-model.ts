import z from "zod"

export const NvidiaNimModelEnum = z.enum([
  "minimaxai/minimax-m2.5",
  "z-ai/glm4.7",
  "z-ai/glm5",
  "moonshotai/kimi-k2.5",
  "deepseek-ai/deepseek-v3.1-terminus",
  "deepseek-ai/deepseek-v3.1",
  "deepseek-ai/deepseek-v3.2",
  "qwen/qwen3.5-122b-a10b",
  "qwen/qwen3.5-397b-a17b",
  "qwen/qwen3-coder-480b-a35b-instruct",
  "nvidia/nemotron-3-super-120b-a12b",
  "stepfun-ai/step-3.5-flash",
])
