import archiver from 'archiver'
import { createWriteStream, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = resolve(__dirname, '..')
const distPath = resolve(projectRoot, 'dist')
const zipPath = resolve(projectRoot, 'voice-recorder-extension.zip')

if (!existsSync(distPath)) {
  console.error('❌ dist目录不存在，请先运行 npm run build')
  process.exit(1)
}

const output = createWriteStream(zipPath)
const archive = archiver('zip', {
  zlib: { level: 9 }
})

output.on('close', () => {
  console.log(`✅ 打包完成: ${archive.pointer()} bytes`)
  console.log(`📦 文件位置: ${zipPath}`)
})

archive.on('error', (err) => {
  console.error('❌ 打包失败:', err)
  process.exit(1)
})

archive.pipe(output)
archive.directory(distPath, false)
archive.finalize()

console.log('🔄 正在打包扩展...')