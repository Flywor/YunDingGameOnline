window.globalMaps = [
  {
      id: 1,
      name: "聚灵城-广场",
      is_city: true,
      up: [],
      next: [1000, 1001, 1002, 1003, 2, 3]
  },
  {
      id: 1000,
      name: "聚灵城-东",
      is_city: true,
      up: [1],
      next: [2, 3]
  },
  {
      id: 1001,
      name: "聚灵城-南",
      is_city: true,
      up: [1],
      next: [2, 3]
  },
  {
      id: 1002,
      name: "聚灵城-西",
      is_city: true,
      up: [1],
      next: [2, 3]
  },
  {
      id: 1003,
      name: "聚灵城-北",
      is_city: true,
      up: [1],
      next: [2, 3]
  },
  {
      id: 2,
      name: "梵风岭",
      is_city: false,
      // montser: [{
      //     id: "123",
      //     left: "20%",
      //     img: "http://ydxx.andiliba.cn/public/0.png",
      //     name: "天星",
      //     bat_id: "5f28c318d34d507a81f8c2f5",
      //     is_bat: false
      // }],
      up: [1, 1000, 1001, 1002, 1003],
      next: [4]
  },
  {
      id: 3,
      name: "雨落道",
      is_city: false,
      up: [1, 1000, 1001, 1002, 1003],
      next: [5]
  },
  {
      id: 4,
      name: "梵风岭-东",
      is_city: false,
      up: [2, 6],
      next: []
  },
  {
      id: 5,
      name: "雨落东城",
      is_city: true,
      up: [3],
      next: [6, 7, 8, 9]
  },
  {
      id: 6,
      name: "追风谷",
      is_city: false,
      up: [5],
      next: [4]
  },
  {
      id: 7,
      name: "通天道",
      is_city: false,
      up: [5],
      next: [10]
  },
  {
      id: 8,
      name: "长树林海",
      is_city: false,
      up: [5],
      next: [11]
  },
  {
      id: 9,
      name: "玉花县",
      is_city: true,
      up: [5],
      next: [12]
  },
  {
      id: 10,
      name: "天都城",
      is_city: true,
      up: [7],
      next: [13, 16]
  },
  {
      id: 11,
      name: "林中栈道",
      is_city: false,
      up: [8],
      next: []
  },
  {
      id: 12,
      name: "栀花荒野",
      is_city: false,
      up: [9],
      next: []
  },
  {
      id: 13,
      name: "九幽-西",
      is_city: false,
      up: [10],
      next: [14]
  },
  {
      id: 14,
      name: "九幽殿",
      is_city: true,
      up: [13],
      next: [15, 16]
  },
  {
      id: 15,
      name: "九幽-东",
      is_city: true,
      up: [14],
      next: []
  },
  {
      id: 16,
      name: "聚仙驿站",
      is_city: true,
      up: [10],
      next: [14, 17, 18, 19]
  }, {
      id: 17,
      name: "黑海森狱",
      is_city: false,
      up: [16],
      next: [18]
  }, {
      id: 18,
      name: "黑龙沼",
      is_city: false,
      up: [16],
      next: []
  }, {
      id: 19,
      name: "融天岭",
      is_city: false,
      up: [16],
      next: []
  },

]