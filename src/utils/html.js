import * as fflate from 'fflate'
import mime from 'mime-types'
import { IPFS_DIRECTORY_MIMETYPE } from '../constants'

export async function prepareFilesFromZIP(buffer) {
  // unzip files
  let files = await unzipBuffer(buffer)

  // inject CSP meta tag
  const indexBlob = files['index.html']
  const indexBuffer = await indexBlob.arrayBuffer()
  const safeIndexBuffer = injectCSPMetaTagIntoBuffer(indexBuffer)
  files['index.html'] = new Blob([safeIndexBuffer], {
    type: indexBlob.type,
  })

  // reformat
  files = Object.entries(files).map((file) => {
    return {
      path: file[0],
      blob: file[1],
    }
  })

  // remove top level dir
  files = files.filter((f) => f.path !== '')

  return files
}

export async function unzipBuffer(buffer) {
  let entries = fflate.unzipSync(buffer)
  entries = Object.entries(entries).map((entry) => {
    return {
      path: entry[0],
      buffer: entry[1],
    }
  })

  // Find root dir
  let rootDir = null
  for (let i = 0; i < entries.length; i++) {
    const parts = entries[i].path.split('/')
    const filename = parts[parts.length - 1]
    if (filename === 'index.html') {
      const parts = entries[i].path.split('/')
      parts.pop()
      rootDir = parts.join('/')
      break
    }
  }

  if (rootDir === null) {
    const msg = 'No index.html file found!'
    window.alert(msg)
    throw new Error(msg)
  }

  // Create files map
  const files = {}
  entries.forEach((entry, index) => {
    const relPath = entry.path.replace(`${rootDir}/`, '')
    const type =
      entry.buffer.length === 0
        ? IPFS_DIRECTORY_MIMETYPE
        : mime.lookup(entry.path)
    files[relPath] = new Blob([entry.buffer], {
      type,
    })
  })

  return files
}

export function injectCSPMetaTagIntoDataURI(dataURI) {
  // data URI -> HTML
  const prefix = 'data:text/html;base64,'
  const base64 = dataURI.replace(prefix, '')
  const html = atob(base64)

  // inject CSP meta tag
  const safeHTML = injectCSPMetaTagIntoHTML(html)

  // HTML -> data URI
  return `${prefix}${btoa(safeHTML)}`
}

export function injectCSPMetaTagIntoBuffer(buffer) {
  // buffer -> HTML
  const html = new TextDecoder().decode(buffer)

  // inject CSP meta tag
  const safeHTML = injectCSPMetaTagIntoHTML(html)

  // HTML -> buffer
  return new TextEncoder().encode(safeHTML)
}

export function injectCSPMetaTagIntoHTML(html) {
  // HTML -> doc
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // remove any existing CSP meta tags
  const existing = doc.head.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"]'
  )
  if (existing.length) {
    for (let i = 0; i < existing.length; i++) {
      existing[i].remove()
    }
  }

  if (!doc.head) {
    const msg = 'index.html is missing <head> tag!'
    window.alert(msg)
    throw new Error(msg)
  }

  // inject CSP meta tag
  doc.head.insertAdjacentHTML(
    'afterbegin',
    `
    <meta http-equiv="Content-Security-Policy" content="
    upgrade-insecure-requests;
    default-src
      'none';
    script-src
      'self'
      'unsafe-inline';
    manifest-src
      'self';
    media-src
      'self'
      https://ipfs.infura.io
      https://cloudflare-ipfs.com/;
    img-src
      'self'
      data:
      https://ipfs.infura.io
      https://cloudflare-ipfs.com/;
    font-src
      'self'
      https://ipfs.infura.io
      https://cloudflare-ipfs.com/
      https://fonts.googleapis.com/;
    connect-src
      'self'
      https://better-call.dev
      https://*.better-call.dev
      https://*.cryptonomic-infra.tech
      https://cryptonomic-infra.tech
      https://*.infura.io
      https://infura.io
      ws:
      wss:
      bootstrap.libp2p.io
      preload.ipfs.io
      https://api.etherscan.io
      https://api.thegraph.com
      https://*.tzkt.io
      https://*.wikidata.org
      https://*.coinmarketcap.com
      https://api.openweathermap.org
      https://hicetnunc.xyz
      https://*.hicetnunc.xyz;
    worker-src
      'self'
      'unsafe-inline';
    script-src-elem
      'self'
      'unsafe-inline';
    script-src-attr
      'self'
      'unsafe-inline';
    style-src-elem 'self';
    style-src-attr 'self';
    base-uri
      'self';
    form-action
      'none';
    prefetch-src
      'self';">
  `
  )

  // doc -> HTML
  return `<!DOCTYPE html><html>${doc.documentElement.innerHTML}</html>`
}

export function getCoverImagePathFromBuffer(buffer) {
  // buffer -> html
  const html = new TextDecoder().decode(buffer)

  // html -> doc
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const meta = doc.querySelector('meta[property="og:image"]')

  if (!meta) return null

  return meta.getAttribute('content')
}

