import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.argv[2] ?? path.resolve('coverage')
const metricNames = ['statements', 'branches', 'functions', 'lines']

async function readOptional(file) {
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

function createFile() {
  return Object.fromEntries(metricNames.map(name => [name, { covered: 0, total: 0 }]))
}

function addFile(files, name) {
  if (!files.has(name)) files.set(name, createFile())
  return files.get(name)
}

function parseGoProfile(content) {
  const files = new Map()
  for (const line of content.split(/\r?\n/).slice(1)) {
    const match = line.match(/^(.*):\d+\.\d+,\d+\.\d+\s+(\d+)\s+(\d+)$/)
    if (!match) continue
    const name = match[1].replace(/^.*\/backend\//, '')
    const stats = addFile(files, name).statements
    const statements = Number(match[2])
    stats.total += statements
    if (Number(match[3]) > 0) stats.covered += statements
  }
  return files
}

function addGoFunctions(content, files) {
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^(.*\.go):\d+:\s+\S+\s+([\d.]+)%$/)
    if (!match) continue
    const name = match[1].replace(/^.*\/backend\//, '')
    const stats = addFile(files, name).functions
    stats.total += 1
    if (Number(match[2]) > 0) stats.covered += 1
  }
}

function parseLCOV(content) {
  const files = new Map()
  let currentName = ''
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('SF:')) {
      currentName = line.slice(3).replace(/^src\//, '')
      addFile(files, currentName)
    } else if (line.startsWith('DA:') && currentName) {
      const [, hits] = line.slice(3).split(',').map(Number)
      for (const metric of ['statements', 'lines']) {
        const stats = addFile(files, currentName)[metric]
        stats.total += 1
        if (hits > 0) stats.covered += 1
      }
    } else if (line.startsWith('BRDA:') && currentName) {
      const [, , , hits] = line.slice(5).split(',')
      const stats = addFile(files, currentName).branches
      stats.total += 1
      if (hits !== '-' && Number(hits) > 0) stats.covered += 1
    } else if (line.startsWith('FNDA:') && currentName) {
      const [hits] = line.slice(5).split(',')
      const stats = addFile(files, currentName).functions
      stats.total += 1
      if (Number(hits) > 0) stats.covered += 1
    } else if (line === 'end_of_record') {
      currentName = ''
    }
  }
  return files
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function coverageClass(covered, total) {
  const ratio = total === 0 ? 0 : covered / total * 100
  return ratio >= 80 ? 'high' : ratio >= 50 ? 'medium' : 'low'
}

function formatPercentage(covered, total) {
  const percentage = total ? covered / total * 100 : 0
  const display = Number.isInteger(percentage) ? percentage : Math.floor(percentage * 100) / 100
  return `${display}%`
}

function reportHTML({ title, files, metrics, supportedMetrics = metrics, detailHref }) {
  const entries = [...files.entries()].sort(([a], [b]) => a.localeCompare(b))
  const totals = Object.fromEntries(metrics.map(metric => [metric, { covered: 0, total: 0 }]))
  for (const [, values] of entries) {
    for (const metric of metrics) {
      totals[metric].covered += values[metric].covered
      totals[metric].total += values[metric].total
    }
  }
  const metricSummary = metrics.map(metric => {
    if (!supportedMetrics.includes(metric)) {
      return `<div class="metric unavailable"><span class="strong">N/A</span><span class="quiet">${metric[0].toUpperCase()}${metric.slice(1)}</span></div>`
    }
    const { covered, total } = totals[metric]
    return `<div class="metric ${coverageClass(covered, total)}"><span class="strong">${formatPercentage(covered, total)}</span><span class="quiet">${metric[0].toUpperCase()}${metric.slice(1)}</span><span class="fraction">${covered}/${total}</span></div>`
  }).join('\n')
  const header = metrics.map(metric => `<th>${metric[0].toUpperCase()}${metric.slice(1)}</th><th class="abs"></th>`).join('')
  const rows = entries.map(([name, values]) => {
    const columns = metrics.map(metric => {
      if (!supportedMetrics.includes(metric)) return '<td class="pct unavailable">N/A</td><td class="abs unavailable">N/A</td>'
      const { covered, total } = values[metric]
      const cls = coverageClass(covered, total)
      return `<td class="pct ${cls}">${formatPercentage(covered, total)}</td><td class="abs ${cls}">${covered}/${total}</td>`
    }).join('')
    return `<tr><td class="file">${escapeHTML(name)}</td>${columns}</tr>`
  }).join('\n')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code coverage report for ${title}</title>
<style>
:root{font-family:Arial,Helvetica,sans-serif;color:#333;background:#fff}*{box-sizing:border-box}body{margin:0}.wrapper{max-width:1120px;margin:0 auto;padding:28px 24px}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}h1{font-size:22px;font-weight:400;margin:0}.detail{font-size:13px;color:#1683a5;text-decoration:none}.detail:hover{text-decoration:underline}.metrics{display:flex;flex-wrap:wrap;gap:24px;margin:18px 0 26px}.metric{display:flex;gap:6px;align-items:baseline}.strong{font-size:18px;font-weight:700}.quiet{color:#777}.fraction{font-size:12px;color:#777}.high{color:#4d9221}.medium{color:#df9b24}.low{color:#c74634}.unavailable{color:#999}.controls{font-size:13px;color:#777;margin:0 0 18px}.controls input{margin-left:8px;padding:6px 8px;border:1px solid #ccc;border-radius:2px}table{width:100%;border-collapse:collapse;font-size:13px}th{font-weight:400;text-align:right;color:#333;padding:10px 8px;border-bottom:1px solid #bbb;white-space:nowrap}th:first-child{text-align:left;width:30%}th.abs{width:7%}td{padding:10px 8px;border-bottom:1px solid #e5e5e5;text-align:right;white-space:nowrap}td.file{text-align:left;color:#1683a5;font-family:monospace}td.abs{color:#666;font-family:monospace;font-size:12px}@media(max-width:700px){.wrapper{padding:20px 12px;overflow-x:auto}.metrics{gap:14px}.strong{font-size:16px}table{min-width:680px}.top{gap:12px;align-items:flex-start}}
</style></head><body><main class="wrapper"><header class="top"><h1>${title}</h1><a class="detail" href="${detailHref}">View annotated files ↗</a></header><section class="metrics" aria-label="Coverage summary">${metricSummary}</section><label class="controls">Filter: <input id="filter" type="search" aria-label="Filter files"></label><table><thead><tr><th>File</th>${header}</tr></thead><tbody>${rows}</tbody></table></main>
<script>document.querySelector('#filter').addEventListener('input',event=>{const q=event.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(row=>{row.hidden=!row.cells[0].textContent.toLowerCase().includes(q)})})</script></body></html>`
}

const backendProfile = await readOptional(path.join(root, 'backend/coverage.out'))
if (backendProfile !== null) {
  const backendFiles = parseGoProfile(backendProfile)
  const functionProfile = await readOptional(path.join(root, 'backend/functions.txt'))
  if (functionProfile !== null) addGoFunctions(functionProfile, backendFiles)
  await writeFile(path.join(root, 'backend/index.html'), reportHTML({
    title: 'Backend', files: backendFiles, metrics: metricNames,
    supportedMetrics: functionProfile === null ? ['statements'] : ['statements', 'functions'],
    detailHref: 'details.html',
  }))
}

const frontendProfile = await readOptional(path.join(root, 'frontend/details/lcov.info'))
if (frontendProfile !== null) {
  await writeFile(path.join(root, 'frontend/index.html'), reportHTML({
    title: 'Frontend', files: parseLCOV(frontendProfile), metrics: metricNames, detailHref: 'details/index.html',
  }))
}
