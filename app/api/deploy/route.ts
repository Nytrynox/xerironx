import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type FilesMap = Record<string, { code: string }>

export async function POST(req: NextRequest) {
  try {
  const { files, name, token: tokenFromBody, frameworkHint }: { files: FilesMap, name?: string, token?: string, frameworkHint?: string } = await req.json()
    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    const token = (process.env.VERCEL_TOKEN || tokenFromBody || '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Missing Vercel token' }, { status: 400 })
    }

    const filesArray = Object.entries(files).map(([path, val]) => ({
      file: path.startsWith('/') ? path.slice(1) : path,
      data: val?.code ?? '',
    }))

    // Try to infer framework from package.json or hint
    let framework: string | null = null
    let outputDirectory: string | undefined
    let buildCommand: string | undefined
    const pkgPath = Object.keys(files).find(p => p.endsWith('package.json'))
    if (pkgPath) {
      try {
        const pkg = JSON.parse(files[pkgPath].code || '{}')
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
        if (deps.next || files['/next.config.js'] || files['/next.config.ts']) {
          framework = 'nextjs'
        } else if (deps.vite) {
          framework = 'vite'
          outputDirectory = 'dist'
        } else if (deps['react-scripts']) {
          framework = 'create-react-app'
          outputDirectory = 'build'
        }
        // try to read scripts.build output hints
        if (pkg.scripts?.build && /next build/.test(pkg.scripts.build)) framework = 'nextjs'
      } catch {}
    }
  if (!framework && frameworkHint) {
      framework = frameworkHint
      if (framework === 'vite') outputDirectory = outputDirectory || 'dist'
      if (framework === 'create-react-app') outputDirectory = outputDirectory || 'build'
    }

    const payload: any = {
      name: name || 'ai-studio-site',
      files: filesArray,
      source: 'ai-studio',
      target: 'production' as const,
      projectSettings: {
        framework: framework || null,
      },
    }
    if (framework === 'nextjs') {
      // For Next.js, Vercel handles output; ensure package.json exists
      const pkgPath2 = Object.keys(files).find(p => p.endsWith('package.json'))
      if (!pkgPath2) {
        return NextResponse.json({ error: 'Next.js deployment requires a package.json.' }, { status: 400 })
      }
      // Do not set outputDirectory for Next.js; platform manages it
    } else {
      if (outputDirectory) payload.projectSettings.outputDirectory = outputDirectory
      if (buildCommand) payload.projectSettings.buildCommand = buildCommand
    }

    const res = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data?.error || 'Vercel API error', details: data }, { status: res.status })
    }

    // Vercel returns `url` like my-deploy.vercel.app
  const url = data?.url ? (String(data.url).startsWith('http') ? data.url : `https://${data.url}`) : null
  const inspectorUrl = data?.inspectorUrl ? String(data.inspectorUrl) : null
  return NextResponse.json({ url, inspectorUrl, vercel: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to deploy' }, { status: 500 })
  }
}
