import { setTimeout } from 'timers'

export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: any) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export function getBytes(text: string): number {
  text = text.toUpperCase()
  const arr = text.match(/\d+/)
  if (!arr || !arr[0]) {
    throw new Error(`invalid input ${text}`)
  }
  let num = parseInt(arr[0], 10)
  if (text.indexOf('G') !== -1) {
    num = num * 1024 * 1024 * 1024
  } else if (text.indexOf('M') !== -1) {
    num = num * 1024 * 1024
  } else if (text.indexOf('K') !== -1) {
    num = num * 1024
  }
  return num
}
