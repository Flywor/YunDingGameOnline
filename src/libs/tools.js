export const sleep = function (method) {
  const start = Number(Date.now())
  return new Promise((resolve) => {
    (function selfRecursion () {
      setTimeout(() => {
        let flag
        if (typeof method === 'function') {
          flag = method()
        }
        if (typeof method === 'number') {
          flag = Number(Date.now()) - start < method
        }
        if (flag) {
          selfRecursion()
        } else {
          resolve()
        }
      }, 10)
    })()
  })
}