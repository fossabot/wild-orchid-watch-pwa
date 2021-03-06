import * as Sentry from '@sentry/browser' // piggybacks on the config done in src/main.js
import { isNil } from 'lodash'

const commonHeaders = {
  Accept: 'application/json',
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  ...commonHeaders,
}

// Prefer to dispatch('flagGlobalError') as that will inform the UI and call
// this eventually
export function wowErrorHandler(msg, err) {
  console.error(msg, err || '(no error object passed')
  const processedError = chainedError(msg, err)
  Sentry.captureException(processedError)
}

export function wowWarnHandler(msg, err) {
  console.warn(msg, err || '(no error object passed)')
  Sentry.withScope(scope => {
    scope.setLevel('warning')
    Sentry.captureException(chainedError(msg, err))
  })
}

export function postJson(url, data = {}) {
  const authHeaderValue = null
  return postJsonWithAuth(url, data, authHeaderValue)
}

export function postJsonWithAuth(url, data = {}, authHeaderValue) {
  // TODO consider using https://github.com/sindresorhus/ky instead of fetch()
  return doManagedFetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      ...jsonHeaders,
      Authorization: authHeaderValue,
    },
    body: JSON.stringify(data),
  })
}

export function putJsonWithAuth(url, data = {}, authHeaderValue) {
  return doManagedFetch(url, {
    method: 'PUT',
    mode: 'cors',
    headers: {
      ...jsonHeaders,
      Authorization: authHeaderValue,
    },
    body: JSON.stringify(data),
  })
}

export function postFormDataWithAuth(
  url,
  populateFormDataCallback,
  authHeaderValue,
) {
  const formData = new FormData()
  populateFormDataCallback(formData)
  return doManagedFetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      ...commonHeaders,
      Authorization: authHeaderValue,
    },
    body: formData,
  })
}

export function getJson(url) {
  const authHeader = null
  return getJsonWithAuth(url, authHeader)
}

export function getJsonWithAuth(url, authHeaderValue) {
  // supplying cache: 'no-store' to fetch() works perfectly expect for iOS
  // Safari which explodes, so we have to fall back to this dirty way of cache
  // busting
  const isQueryStringPresent = url.includes('?')
  const cacheBustSeparator = isQueryStringPresent ? '&' : '?'
  const urlWithCacheBust = `${url}${cacheBustSeparator}cache-bust=${Date.now()}`
  return doManagedFetch(urlWithCacheBust, {
    method: 'GET',
    mode: 'cors',
    headers: {
      ...jsonHeaders,
      Authorization: authHeaderValue,
    },
  })
}

export function deleteWithAuth(url, authHeaderValue) {
  return doManagedFetch(url, {
    method: 'DELETE',
    mode: 'cors',
    headers: {
      ...jsonHeaders,
      Authorization: authHeaderValue,
    },
  })
}

async function doManagedFetch(url, req) {
  try {
    const resp = await fetch(url, req)
    const result = await handleJsonResp(resp, req)
    return result
  } catch (err) {
    let msg = `Failed while doing fetch() with\n`
    msg += `  URL='${url}'\n`
    msg += `  Req body='${JSON.stringify(req, null, 2)}'`
    throw chainedError(msg, err)
  }
}

async function handleJsonResp(resp) {
  const isJson = isRespJson(resp)
  const isRespOk = resp.ok
  try {
    if (isRespOk && isJson) {
      return resp.json()
    }
  } catch (err) {
    throw chainedError('Failed while parsing JSON response', err)
  }
  // resp either NOT ok or NOT JSON, prep nice error msg
  const bodyAccessor = isJson ? 'json' : 'text'
  const bodyPromise = resp.bodyUsed
    ? Promise.resolve('(body already used)')
    : resp[bodyAccessor]()
  const body = await bodyPromise
  const trimmedBody =
    typeof body === 'string'
      ? body.substr(0, 300)
      : JSON.stringify(body).substr(0, 300)
  let msg = `\nResp details:\n`
  msg += `  is ok=${isRespOk},\n`
  msg += `  is JSON=${isJson}\n`
  msg += `  status=${resp.status}\n`
  msg += `  statusText='${resp.statusText}'\n`
  msg += `  headers=${JSON.stringify(resp.headers)}\n`
  msg += `  url=${resp.url}\n`
  msg += `  body first 300 chars='${trimmedBody}'\n`
  const err = new Error(msg)
  err.httpStatus = resp.status
  throw err
}

/**
 * Assert that the record matches our schema.
 *
 * Using a verifier seems more maintainable than a mapper function. A mapper
 * would have a growing list of either unnamed params or named params which
 * would already be the result object. A verifier lets your freehand map the
 * object but it still shows linkage between all the locations we do mapping
 * (hopefully not many).
 */
export function verifyWowDomainPhoto(photo) {
  let msg = ''
  assertFieldPresent('id')
  assertFieldPresent('url')
  assertFieldPresent('licenseCode')
  assertFieldPresent('attribution')
  if (msg) {
    throw new Error(msg)
  }
  return
  function assertFieldPresent(fieldName) {
    photo[fieldName] ||
      (msg += `Invalid photo record, ${fieldName}='${
        photo[fieldName]
      }' is missing. `)
  }
}

function isRespJson(resp) {
  const mimeStr = resp.headers.get('Content-Type') || ''
  return /application\/(\w+(\.\w+)*\+)?json/.test(mimeStr)
}

export function chainedError(msg, err) {
  if (!err) {
    return new Error(
      `${msg}\nWARNING: chainedError` + ` was called without an error to chain`,
    )
  }
  err.message = `${msg}\nCaused by: ${err.message}`
  return err
}

export function now() {
  return new Date().getTime()
}

export function formatMetricDistance(metres) {
  if (!metres) {
    return metres
  } else if (metres < 1000) {
    return `${metres}m`
  }
  const kmVal = (metres / 1000).toFixed(1)
  return `${kmVal}km`
}

export function buildUrlSuffix(path, params = {}) {
  const querystring = Object.keys(params).reduce((accum, currKey) => {
    const value = params[currKey]
    if (isNil(value)) {
      return accum
    }
    return `${accum}${currKey}=${value}&`
  }, '')
  const qsSep = querystring ? '?' : ''
  return `${path}${qsSep}${querystring.replace(/&$/, '')}`
}

/**
 * Returns a function that can be used as a vuex getter to check if the
 * specified timestamp field has expired, so the corresponding field is
 * considered stale.
 */
export function buildStaleCheckerFn(stateKey, staleThresholdMinutes) {
  return function(state) {
    const lastUpdatedMs = state[stateKey]
    return (
      !lastUpdatedMs ||
      lastUpdatedMs < now() - staleThresholdMinutes * 60 * 1000
    )
  }
}

/**
 * Takes an array of valid values and returns a validator function. The
 * validator function takes a single param and returns it as-is if valid,
 * otherwise throws an error.
 */
export function makeEnumValidator(array) {
  if (array.constructor !== Array || !array.length) {
    throw new Error('Input must be a non-empty array!')
  }
  return function(enumItem) {
    const isValid = array.includes(enumItem)
    if (!isValid) {
      throw new Error(
        `Invalid enum value='${enumItem}' is not in valid values=[${array}]`,
      )
    }
    return enumItem
  }
}

// Thanks for these two functions:
// https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices#not_everything_can_be_stored_in_indexeddb_on_all_platforms
//
// Safari on iOS cannot store Blobs, which are what we get from the file input
// UI control, so we have to convert them to ArrayBuffers, which do have
// support.
export function arrayBufferToBlob(buffer, type) {
  return new Blob([buffer], { type: type })
}

export function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('loadend', () => {
      resolve(reader.result)
    })
    reader.addEventListener('error', reject)
    reader.readAsArrayBuffer(blob)
  })
}

export const _testonly = {
  buildUrlSuffix,
  formatMetricDistance,
  isRespJson,
  makeEnumValidator,
  verifyWowDomainPhoto,
}
