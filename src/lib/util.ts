import { setTimeout } from 'timers'

export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: any) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
