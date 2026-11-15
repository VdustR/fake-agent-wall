export type ToolProfile = 'read' | 'write' | 'search' | 'remote' | 'controller'
  | 'build' | 'rust' | 'go' | 'docker' | 'test' | 'test-single'
  | 'check' | 'lint' | 'lint-parallel' | 'install' | 'publish' | 'git' | 'utility'

export interface ToolDescriptor {
  readonly tool: string
  /** The command shown by the session, not a command to execute on this host. */
  readonly command: string
  readonly executable: string
  readonly profile: ToolProfile
  readonly shell: boolean
}

export interface ToolExecution {
  readonly id: number
  readonly descriptor: ToolDescriptor
  readonly startedAt: number
}

/** Classify the controlled transcript at its creation boundary, never its DOM. */
export function describeTool(text: string): ToolDescriptor {
  const call = /^● ([^(]+)\(([\s\S]*)\)$/.exec(text)
  const tool = call?.[1]?.trim() ?? text.replace(/^● /, '')
  const argument = call?.[2] ?? ''
  const shell = tool === 'Bash'
  const command = shell ? argument : text.replace(/^● /, '')
  let executable = argument.replace(/^pnpm\s+dlx\s+/, '').replace(/^(?:pnpm|npm|npx|yarn|bun)\s+(?:(?:exec|run)\s+)?/, '')
  let profile: ToolProfile = 'controller'
  if (!shell) {
    if (tool === 'Grep') profile = 'search'
    else if (tool === 'Read' || tool === 'Glob') profile = 'read'
    else if (tool === 'Edit' || tool === 'Update' || tool === 'Write') profile = 'write'
    else if (/^(?:Web|Decide|Task)/.test(tool)) profile = 'remote'
    const query = /pattern: "([^"]*)", path: "([^"]*)"/.exec(argument)
    executable = tool === 'Grep' ? 'rg ' + (query ? JSON.stringify(query[1]) + ' ' + JSON.stringify(query[2]) : argument) : tool
  } else {
    if (/^cargo\s+(?:build|check)\b/.test(command)) profile = 'rust'
    else if (/^go\s+build\b/.test(command)) profile = 'go'
    else if (/^docker\s+build\b/.test(command)) profile = 'docker'
    else if (/^(?:git\s+push|docker\s+push|(?:pnpm|npm|yarn|bun)\s+publish)\b/.test(command)) profile = 'publish'
    else if (/^(?:ollama\s+pull|brew\s+install|mise\s+install|(?:pnpm|npm|yarn|bun)\s+(?:install|add))\b/.test(command)) profile = 'install'
    else if (/^(?:uv\s+run\s+)?(?:python\s+-m\s+)?pytest\b/.test(executable)) profile = /(?:^|\s)(?:-n\s*|--numprocesses(?:=|\s+))(?:auto|logical|[2-9]|[1-9]\d+)(?=\s|$)/.test(command) ? 'test' : 'test-single'
    else if (/^(?:vitest|playwright)\b/.test(executable) || /^(?:cargo|go)\s+test\b/.test(command)) profile = 'test'
    else if (/^(?:bench)\b/.test(executable)) profile = 'test-single'
    else if (/^(?:tsc|svelte-check|check)\b/.test(executable)) profile = 'check'
    else if (/^(?:(?:uv\s+run\s+)?ruff|oxlint|biome)\b/.test(executable)) profile = 'lint-parallel'
    else if (/^eslint\b/.test(executable)) profile = /--concurrency\s+(?:auto|(?:[2-9]|[1-9]\d+))\b/.test(command) ? 'lint-parallel' : 'lint'
    else if (/^(?:vite\s+build|rolldown|build)\b/.test(executable)) profile = 'build'
    else if (/^git\s+(?:clone|fetch|pull|push)\b/.test(command)) profile = 'install'
    else if (/^git\b/.test(command)) profile = 'git'
    else if (/^(?:rg|grep|find)\b/.test(executable)) profile = 'search'
    else if (/^(?:curl|wget|kubectl|terraform)\b/.test(executable)) profile = 'remote'
    else profile = 'utility'
    if (/^uv run pytest\b/.test(executable)) executable = executable.replace(/^uv run pytest/, 'python -m pytest')
    if (/^(?:tsc|svelte-check|eslint|vite|vitest|playwright|rolldown|build)\b/.test(executable)) executable = 'node ' + executable
  }
  return { tool, command, executable, profile, shell }
}
