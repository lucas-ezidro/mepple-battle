import axios from 'axios'
import { getCookie } from 'cookies-next'
import { CookiesFn } from 'cookies-next/lib/types'

const api = axios.create({
  baseURL: 'https://transactions-api-7iwy.onrender.com',
})

api.interceptors.request.use(async (config) => {
  let cookieStore: CookiesFn | undefined

  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')
    cookieStore = serverCookies
  }

  const token = getCookie('token', { cookies: cookieStore })

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export { api }