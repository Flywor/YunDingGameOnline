import configData from "@/config.js";

export const sleep = function (method) {
  const start = Number(Date.now())
  return new Promise((resolve) => {
    (function selfRecursion () {
      setTimeout(() => {
        let flag
        if (typeof method === 'function') {
          flag = !method()
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

export const findMapPath = function (nowid, toid) {
  const maps = configData.maps
  const topath = []

  function circleCalcle (nid, pre = []) {
    const { up, next } = maps.find(m => m.id === nid)
    const allId = up.concat(next)
    if (pre.length > 0 && !allId.some(id => id === pre[pre.length - 1])) return
    allId.filter(id => !pre.some(p => p === id)).map(id => {
      if (id === toid) {
        topath.push([...pre, nid, id])
        return
      }
      circleCalcle(id, [...pre, nid])
    })
  }

  circleCalcle(nowid)
  const nicePath = topath.sort((n, m) => n.length - m.length)[0]
  nicePath.splice(0, 1)
console.log(nicePath)
  return nicePath.map(id => maps.find(m => m.id === id))
}