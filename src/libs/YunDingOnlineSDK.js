import Protocol from './protocol'
// 调试模式
let DEBUG = false;

/**
 * 一些常量
 */
const JS_WS_CLIENT_TYPE = 'js-websocket';
const JS_WS_CLIENT_VERSION = '0.0.1';

/**
 * 返回消息状态码
 */
const RES_OK = 200;         // 成功
const RES_FAIL = 500;       // 失败
const RES_OLD_CLIENT = 501; // 客户端版本不符

const gapThreshold = 100;   // heartbeat gap threashold

/**
 * {object} 默认配置
 */
let default_config = {
    gameHost: 'yundingxx.com',
    gameProtocol: 'ws',
    loginPort: 3014,
    gamePort: 3052,
    loginServer: null,
    gameServer: null,
    socketPathTpl: '{protocol}://{host}:{port}/'
};

let Package = Protocol.Package,
    Message = Protocol.Message;

/**
 * 工具类
 */
let Tool = {
    /**
     * 替换字符串中的变量占位符
     *
     * @param {string} str           需要替换的字符串
     * @param {object} replaceMaps   替换关系
     */
    replaceParams: function (str, replaceMaps) {
        return str.replace(/{([^}]+)}/g, function (full_match, key) {
            return replaceMaps[key] || full_match;
        });
    }
}

/**
 * Hooks 默认的
 */
let CoreHooks = {
    /**
     * 登录游戏成功回调
     * @param {*} data
     */
    onLoginGame: function (data) {
        if (data.code != RES_OK) {
            DEBUG && console.error('onLoginGame', data.msg);
            return;
        }

        this.user_info = Object.assign(this.user_info, data.data);
    },
    /**
        * 主要是用于保存数据
        * @param {*} data
        */
    onSaveData: function (data) {
        if (data.code != RES_OK) {
            DEBUG && console.error('onLoginGame', data.msg || data);
            return;
        }

        let datas = data.data || data,
            save_keys = ['map', 'myInfo', 'players', 'userTasks', 'wordLogds', 'team', 'teams', 'screens', 'initData'];
        save_keys.forEach((key) => {
            if (!datas[key]) {
                return;
            }
            this.user_info[key] = datas[key];

            if (key == 'map') {
                this.user_info.mid = datas.map.id;
            }
        })
    }
}

// 给Hook绑定 Mark
Object.keys(CoreHooks).forEach((name) => {
    CoreHooks[name].hookMark = 'Core.' + name;
});

/**
* YunDingXX Online API
*
* @param {object} config   配置信息
*/
let GameApi = function (config) {
    // 加载配置
    if ('object' == typeof config || 'undefined' == typeof config) {
        this.config = Object.assign(default_config, config);
    }

    // 初始化配置
    this.initConfig();
};

// 设置调试模式
GameApi.isDEBUG = function () {
    DEBUG = true;
}

/**
* 初始化配置信息
*/
GameApi.prototype.initConfig = function () {
    // WebSocket 链接对象
    this.socket = null;

    // 用于标记自己要停止
    this.isStop = false;

    // 玩家信息都存在这里 渲染视图请读取这里
    this.email = '';
    this.password = ''; // 用于自动重连
    this.user_info = {};

    // 登录 Token 我猜你不会偷这个吧?
    this.token = null;

    // 生成服务器链接地址
    if (!this.config.loginServer) {
        this.config.loginServer = this.getSocketServer(this.config.loginPort);
    }

    // 消息处理分发
    this.messageHandlers = [];
    this.messageHandlers[Package.TYPE_HANDSHAKE] = this.onHandshake;
    this.messageHandlers[Package.TYPE_HEARTBEAT] = this.onHeartbeat;
    this.messageHandlers[Package.TYPE_DATA] = this.onData;
    this.messageHandlers[Package.TYPE_KICK] = this.onKick;

    // 维持心跳
    this.reqId = 1;
    this.heartbeatInterval = 0;
    this.heartbeatId = null;
    this.heartbeatTimeoutId = null;
    this.heartbeatTimeout = 0;
    this.xyUpdateIntervalId = 0;

    // 路由字典
    this.dict = {};
    this.abbrs = {};

    // 协议相关???
    this.protoVersion = 0;
    this.serverProtos = {};
    this.clientProtos = {};

    // 一些无法命名的回调
    this.initCallback = null;   // 初始化完毕的回调
    this.callbacks = [];        // 根据 SeqId 来区分回调(如果有)
    this.callRoutes = [];       // 和上面一样 只是区分 Route

    // 注册各路由的回调钩子
    this.hookHandlers = GameApi.regHookHandlers;
}

/**
* 用于批量提前注册，避免每次创建都要注册一次
*/
GameApi.regHookHandlers = {
    "onAdd": [],    //* 玩家上线?
    "onLeave": [],    //* 玩家离开
    "onChatMsg": [],    //* 收到消息
    "onMyTeamReload": [ // 重新载入队伍
        CoreHooks.onSaveData
    ],
    "onStartBat": [ // 战斗开始
        CoreHooks.onSaveData
    ],
    "onRoundBatEnd": [ // 战斗结束

    ],
    "chat.chatHandler.send": [],    //  发送消息
    "connector.entryHandler.enter": [],
    "connector.fationHandler.applyForFation": [],    //  申请工会
    "connector.fationHandler.closeUserTask": [],    //  放弃任务
    "connector.fationHandler.createFation": [],    //  创建工会
    "connector.fationHandler.donateFationFunds": [],    //  捐赠
    "connector.fationHandler.doneFationApply": [],    //  同意入会
    "connector.fationHandler.getFationApply": [],    //  查看申请
    "connector.fationHandler.getFationList": [],    //  打开工会列表
    "connector.fationHandler.getFationTask": [],    //  领取任务
    "connector.fationHandler.initFation": [],    //  初始聚仙阁楼页面
    "connector.fationHandler.leaveFation": [],    //  脱离工会
    "connector.fationHandler.showFationUserList": [],    //  查看工会人员
    "connector.fationHandler.upFation": [],    //  升级工会
    "connector.fationHandler.upFationUserSkill": [console.log],    //  点技能
    "connector.fationHandler.upUserFationLevel": [],    //  升降职位
    "connector.loginHandler.login": [      //  登录 Token
        CoreHooks.onSaveData
    ],
    "connector.playerHandler.byGoodsToSystem": [],    //  购买系统物品
    "connector.playerHandler.byPalyerGoods": [],    //  购买玩家物品
    "connector.playerHandler.getCopyTask": [],
    "connector.playerHandler.getPlayerSellGoods": [],    //  初始仙坊集市
    "connector.playerHandler.init": [],
    "connector.playerHandler.move": [],    //  移动
    "connector.playerHandler.moveToNewMap": [      //  移动至新地图
        CoreHooks.onSaveData
    ],
    "connector.playerHandler.nextMap": [],    //  切换地图
    "connector.playerHandler.payUserTask": [],    //  完成任务
    "connector.playerHandler.sellGoods": [],
    "connector.playerHandler.sendMsg": [],
    "connector.playerHandler.wearUserEquipment": [],    //  佩戴拆卸装备
    "connector.systemHandler.getRankList": [],    //  排行榜
    "connector.systemHandler.getSystemSellGoods": [],    //  初始系统中出售物品
    "connector.systemHandler.getSystemTask": [],    //  初始任务中心
    "connector.teamHandler.addTeam": [],    // 加入队伍
    "connector.teamHandler.createdTeam": [ // //  创建队伍
        CoreHooks.onSaveData
    ],
    "connector.teamHandler.getAllCombatScreen": [ // 获取战斗场景
        CoreHooks.onSaveData
    ],
    "connector.teamHandler.getTeamList": [  // 获取队伍列表
        CoreHooks.onSaveData
    ],
    "connector.teamHandler.leaveTeam": [],    //  离开队伍
    "connector.teamHandler.roundOperating": [],    //  回合操作
    "connector.teamHandler.showMyTeam": [],    //  显示我的团队
    "connector.teamHandler.startCombat": [],
    "connector.teamHandler.switchCombatScreen": [], // 切换战斗场景
    "connector.userHandler.addUserPetSkill": [],    //  添加用户宠物技能
    "connector.userHandler.allSellGoods": [],    //  整理
    "connector.userHandler.allocationPoint": [],    //  保存/分配属性点
    "connector.userHandler.fbProcess": [],    //  法宝点击
    "connector.userHandler.fitPet": [],    //  确认合成
    "connector.userHandler.getMyFb": [],    //  获取我的法宝
    "connector.userHandler.getMyGoods": [],    //  初始我得物品
    "connector.userHandler.getMyPet": [],    //  初始我得宠物
    "connector.userHandler.getMyPetSkillGoods": [],    //  获取我的宠物用品
    "connector.userHandler.getMySkill": [],    //  初始我得技能
    "connector.userHandler.getMyTitle": [],    //  称号弹框
    "connector.userHandler.getMylogs": [],    //  查看我的日志
    "connector.userHandler.getUserEqs": [],    //  获取我得装备列表
    "connector.userHandler.getUserTask": [],
    "connector.userHandler.makeGoods": [],    //  合成物品
    "connector.userHandler.playUserPet": [],    //  出战宠物
    "connector.userHandler.polyLin": [],    //  聚灵
    "connector.userHandler.repairUserArms": [],    //  修炼装备
    "connector.userHandler.resetAttribute": [],    //  重置属性
    "connector.userHandler.selectMyTitle": [],    //  选择我的称号
    "connector.userHandler.sellGoods": [],
    "connector.userHandler.shelfMyGoods": [],    //  取回到背包
    "connector.userHandler.turnIntoPet": [],    //  幻化宠物
    "connector.userHandler.upPlayerLevel": [],
    "connector.userHandler.upUserPetLevel": [],    //  升级宠物
    "connector.userHandler.updateUserPrice": [],    //  更新玩家货币
    "connector.userHandler.useGoods": [],    //  使用物品
    "connector.userHandler.userInfo": [],
    "connector.userHandler.wbt": [],    //  挖宝图
    "connector.userHandler.xyDuiHuan": [],
    "connector.userHandler.xyUpdate": [ // //  仙蕴提交
        CoreHooks.onSaveData
    ],
    "gate.gateHandler.queryEntry": [] // *登录游戏
};

/**
* 生成服务器链接地址
* @param {*} port
*/
GameApi.prototype.getSocketServer = function (port, host, protocol) {
    if ('number' != typeof port) {
        return null;
    }

    return Tool.replaceParams(this.config.socketPathTpl, {
        protocol: protocol || this.config.gameProtocol,
        host: host || this.config.gameHost,
        port: port
    });
}

/**
* 注册路由回调钩子
* @param {string}   route      挂载的路由地址
* @param {function} cb         回调
* @param {string}   position   用于 触发时机 暂不可用
*/
GameApi.prototype.regHookHandler = function (route, cb, position) {
    // 检查 route 和 cn 是否有效
    if (!this.hookHandlers[route] || 'function' != typeof cb) {
        return false;
    }

    // 如果有 Mark 就尝试去重
    let cbMark = cb.hookMark || null;
    if (cbMark && 'object' == typeof this.hookHandlers[route]) {
        for (let i = 0; i < this.hookHandlers[route].length; i++) {
            const cb_item = this.hookHandlers[route][i];
            if (cb_item.hookMark && cbMark == cb_item.hookMark) {
                return cb_item;
            }
        }
    }

    // 追加到结果
    this.hookHandlers[route].push(cb);

    return true;
}

/**
* 启动实例
*/
GameApi.prototype.start = function () {
    if (this.socket) {
        return;
    }
    // 建立 ws 链接
    this.createWebSocket(this.config.loginServer);
}

/**
* 创建一个 WebSocket 连接并初始化
*
* @param {string} url 服务地址 ws://host:prot/path
*/
GameApi.prototype.createWebSocket = function (url) {
    // 创建对象
    let socket = new WebSocket(url);

    // 指定传输数据类型
    socket.binaryType = 'arraybuffer';

    /**
        * 批量绑定相关回调事件
        */
    let bindEvents = {
        open: this.onOpen,
        message: this.onMessage,
        error: this.onError,
        close: this.onClose
    };

    // 遍历事件列表 添加 绑定
    Object.keys(bindEvents).map((enevtName) => {
        socket.addEventListener(enevtName, (event) => {
            bindEvents[enevtName].call(this, event);
        });
    });

    // 将 reqId 重置
    this.reqId = 1;
    this.socket = socket;

    return socket;
}

/**
* WebSocket 建立连接的回调
*
* @param {object} event
*/
GameApi.prototype.onOpen = function (event) {
    // 发送握手包
    this.handShake();
};

/**
* WebSocket 收到消息时的回调
* @param {object} event
*/
GameApi.prototype.onMessage = function (event) {
    let messages = Package.decode(event.data);
    if (messages.type != 3) {
        // console.log('onMessage', messages);
    }

    // 根据事件类型分发到对应的处理程序
    if (Array.isArray(messages)) {
        for (let i = 0; i < messages.length; i++) {
            let msg = messages[i];
            this.messageHandlers.call(this, [msg.type](msg.body));
        }
    } else {
        this.messageHandlers[messages.type].call(this, messages.body);
    }

    // 重新计算心跳包时间
    if (this.heartbeatTimeout) {
        this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
    }
};

/**
* WebSocket 报错时的回调
*
* @param {object} event
*/
GameApi.prototype.onError = function (event) {
    console.log('onError', event);
    window.location.reload();
};

/**
* WebSocket 断开时的回调
*
* @param {object} event
*/
GameApi.prototype.onClose = function (event) {
    console.log('onClose', event, this.isStop);
    if (this.isStop) {
        return;
    }

    // 重连
    this.login();
};

/**
* 发送消息到服务器(自动处理编码信息)
*
* @param {object} data
* @param {string} type
*/
GameApi.prototype.sendMessage = function (data, route, cb) {
    // 分析参数
    if (arguments.length == 2 && 'function' == typeof route) {
        cb = route;
        route = null;
    }

    // 解包消息
    let bytes = Protocol.strencode(JSON.stringify(data)),
        pkg_type = Package.TYPE_HANDSHAKE,
        routeId = null;

    // 分析路由情况
    if ('string' == typeof route) {
        // 是否压缩路由 (存在 Dict 的就压缩)
        let compressRoute = 0;
        if (this.dict && this.dict[route]) {
            routeId = this.dict[route];
            compressRoute = 1;
        }

        // 然后生成 Message
        let reqId = this.reqId++ % 255;
        let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

        // 设置回调
        if ('function' == typeof cb || 'string' == typeof cb) {
            this.callbacks[reqId] = cb;
        }

        // 设置回调路由表
        this.callRoutes[reqId] = route;

        // 将消息打包
        bytes = Message.encode(reqId, type, compressRoute, compressRoute ? routeId : route, bytes);
        pkg_type = Package.TYPE_DATA;
    }

    // 封装到最终格式
    let packet = Package.encode(pkg_type, bytes);

    if (this.socket.readyState === this.socket.CLOSED) {
        location.reload()
    }

    // 发出封包 这里应该有发送失败的处理
    this.socket.send(packet);
}

/**
* 处理握手返回包
*
* @param {*} data
*/
GameApi.prototype.onHandshake = function (data) {
    // 解码数据
    data = JSON.parse(Protocol.strdecode(data));
    DEBUG && console.log('onHandshake', data);

    // 报错的话
    if (data.code === RES_OLD_CLIENT) {
        throw new Error('client version not fullfill');
        return;
    }

    // 其他错误
    if (data.code !== RES_OK) {
        throw new Error('handshake fail');
        return;
    }

    // 要发送握手回复
    let packet = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    this.socket.send(packet);

    // 保存心跳时间
    if (data.sys && data.sys.heartbeat) {
        // 超时信息
        this.heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
        this.heartbeatTimeout = this.heartbeatInterval * 2;        // max heartbeat timeout

        // 保存字典
        let dict = data.sys.dict;

        // Init compress dict
        if (dict) {
            this.dict = dict;
            this.abbrs = {};

            for (let route in dict) {
                this.abbrs[dict[route]] = route;
            }
        }
    }

    // 保存 protos 信息
    if (data.sys && data.sys.protos) {
        let protos = data.sys.protos;

        // Init protobuf protos
        if (protos) {
            this.protoVersion = protos.version || 0;
            this.serverProtos = protos.server || {};
            this.clientProtos = protos.client || {};
        }
    }

    // if (typeof handshakeCallback === 'function') {
    //     handshakeCallback(data.user);
    // }

    // 握手成功有回调的话
    if (this.initCallback) {
        this.initCallback.call(this);
        this.initCallback = null;
    }
};

/**
* 保持心跳
*/
GameApi.prototype.onHeartbeat = function () {
    if (!this.heartbeatInterval) {
        // no heartbeat
        return;
    }

    let packet = Package.encode(Package.TYPE_HEARTBEAT);
    if (this.heartbeatTimeoutId) {
        clearTimeout(this.heartbeatTimeoutId);
        this.heartbeatTimeoutId = null;
    }

    if (this.heartbeatId) {
        // already in a heartbeat interval
        return;
    }
    this.heartbeatId = setTimeout(() => {
        this.heartbeatId = null;
        this.socket.send(packet);

        this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
        this.heartbeatTimeoutId = setTimeout(this.heartbeatTimeoutCb, this.heartbeatTimeout);
    }, this.heartbeatInterval);
};

/**
* 心跳超时的回调
*/
GameApi.prototype.heartbeatTimeoutCb = function () {
    let gap = this.nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
        this.heartbeatTimeoutId = setTimeout(this.heartbeatTimeoutCb, gap);
    } else {
        DEBUG && console.error('server heartbeat timeout');
    }
};

/**
* 收到数据回复
*
* @param {*} data
*/
GameApi.prototype.onData = function (data) {
    let msg = Message.decode(data);

    // 从发包请求中取回 Route
    if (!msg.route && msg.id && this.callRoutes[msg.id]) {
        msg.route = this.callRoutes[msg.id];
    }

    // 解码 Body
    msg.body = JSON.parse(Protocol.strdecode(msg.body));

    // 检查是否有回调
    let cbMark = [], is_call = false, is_bubble = true;
    if ('function' == typeof this.callbacks[msg.id]) {
        let cb = this.callbacks[msg.id];
        delete this.callbacks[msg.id];
        if ('string' == typeof cb.hookMark) {
            cbMark.push(cb.hookMark);
        }

        is_call = true;
        is_bubble = !(cb.call(this, msg.body) === false);
    }

    // 检查钩子
    if (is_bubble && msg.route && 'object' == typeof this.hookHandlers[msg.route]) {
        for (let i = 0; i < this.hookHandlers[msg.route].length; i++) {
            const cb = this.hookHandlers[msg.route][i];
            if ('string' == typeof cb.hookMark) {
                if (cbMark.indexOf(cb.hookMark) >= 0) {
                    continue;
                }
                cbMark.push(cb.hookMark);
            }

            is_call = true;
            is_bubble = !(cb.call(this, msg.body) === false);
            if (is_bubble) continue;
        }
    }

    // 如果没有人接收 就打印出来
    if (!is_call) {
        DEBUG && console.log('onData', msg.route, msg.body);
    }
};

/**
* 被踢么？
*
* @param {*} data
*/
GameApi.prototype.onKick = function (data) {
    DEBUG && console.log('onKick', data);
};

/**
* 停止进程
*/
GameApi.prototype.Stop = function () {
    // 标记自己要停止了
    this.isStop = true;

    // 如果都没建立 就不存在退出了
    if (!this.socket) {
        return;
    }

    // 断开 WS 链接
    this.socket.close();

    // 停止心跳
    if (this.heartbeatId) {
        clearInterval(this.heartbeatId)
    }
    if (this.heartbeatTimeoutId) {
        clearTimeout(this.heartbeatTimeoutId);
    }
    if (this.xyUpdateIntervalId) {
        clearInterval(this.xyUpdateIntervalId)
    }
}

//======= 下面是游戏事件封装区 =======//

/**
* 发送握手包
*
* WebSocket 链接成功后自动发送
*/
GameApi.prototype.handShake = function () {
    let handshakeBuffer = {
        'sys': {
            type: JS_WS_CLIENT_TYPE,
            version: JS_WS_CLIENT_VERSION,
            rsa: {},
            protoVersion: this.protoVersion
        }
    };

    this.sendMessage(handshakeBuffer);
}

/**
* 登录游戏
*
* @param {*} email
* @param {*} pwd
* @param {*} code
*/
GameApi.prototype.login = function (_email, pwd, code, is_r) {
    let email = _email || this.email,
        password = pwd || this.password,
        route = 'gate.gateHandler.queryEntry',
        data = {
            login_email: email,
            login_pwd: password,
            code: '',
            is_r: true
        };

    // 设置握手回调
    this.initCallback = function () {
        // 尝试保存账号
        this.email = email;
        this.password = pwd;
        this.user_info.email = email;

        // 设置消息回调
        this.sendMessage(data, route, this.onLogin);
    }
    this.start();
}

/**
* 登录成功的回调
*
* @param {*} data
*/
GameApi.prototype.onLogin = function (data) {
    if (data.code != RES_OK) {
        DEBUG && console.error('onLogin', data.msg);
        return true;
    }
    DEBUG && console.log('onLogin', data)

    // 保存端口等信息
    this.config.gamePort = data.port;
    this.user_info.mid = data.mid;
    this.token = data.token;

    // 断开登录链接 重新连接到游戏服务器
    this.isStop = true; // 先标记停止 然后等下再开起来
    this.socket.close();
    this.gameServer = this.getSocketServer(data.port);
    this.initCallback = this.loginToken;
    this.createWebSocket(this.gameServer);
}

/**
* 使用 Token 登录游戏服务器
*/
GameApi.prototype.loginToken = function () {
    let route = 'connector.loginHandler.login',
        data = {
            email: this.user_info.email,
            token: this.token
        };

    // 标记自己开工了
    this.onClose = false;

    // 先清空工作台
    // DEBUG && console.clear();

    // 如果登录成功
    this.sendMessage(data, route, (data) => {
        if (data.code != RES_OK) {
            DEBUG && console.error('登录到游戏服务器失败', data);
            this.Stop();
            return;
        }

        DEBUG && console.log('登录到游戏服务器成功', this, data);

        // 开始定时提交仙蕴
        this.xyUpdateIntervalId = setInterval(() => {
            this.xyUpdate()
        }, 60000);
    });
}

/**
* 仙蕴提交
*/
GameApi.prototype.xyUpdate = function () {
    this.sendMessage({}, "connector.userHandler.xyUpdate");
}

/**
* 查看我的日志
*/
GameApi.prototype.getMylogs = function () {
    this.sendMessage({}, "connector.userHandler.getMylogs");
}

/**
* 获取我的法宝
*/
GameApi.prototype.getMyFb = function () {
    this.sendMessage({}, "connector.userHandler.getMyFb");
}

/**
* 获取我的法宝
*/
GameApi.prototype.upPlayerLevel = function () {
    this.sendMessage({}, "connector.userHandler.upPlayerLevel");
}

/**
* 法宝点击
* @param type 1 升星 2共生 3养灵 4佩戴
* @param id
*/
GameApi.prototype.fbProcess = function (type, id) {
    this.sendMessage({
        type, id
    }, "connector.userHandler.fbProcess");
}

/**
* 移动
* @param x     横坐标
* @param mid   地图id
*/
GameApi.prototype.move = function (x, mid) {
    this.sendMessage({
        x: x,
        mid: mid
    }, "connector.playerHandler.move");
}

/**
* 切换地图
* @param type 0 | 1
*/
GameApi.prototype.nextMap = function (type) {
    this.sendMessage({
        type
    }, "connector.playerHandler.nextMap");
}

/**
* 移动至新地图
*/
GameApi.prototype.moveToNewMap = function (mid) {
    this.sendMessage({
        mid: mid
    }, "connector.playerHandler.moveToNewMap");
}

/**
* 获取战斗场景列表
*/
GameApi.prototype.getAllCombatScreen = function () {
    this.sendMessage({}, "connector.teamHandler.getAllCombatScreen");
}

/**
* 切换战斗场景
* @param {*} cbatid
*/
GameApi.prototype.switchCombatScreen = function (cbatid) {
    this.sendMessage({
        cbatid: cbatid
    }, "connector.teamHandler.switchCombatScreen");
}

/**
* 获取队伍列表
*/
GameApi.prototype.getTeamList = function (mid) {
    this.sendMessage({
        mid: mid
    }, "connector.teamHandler.getTeamList");
}

/**
* 创建队伍
*/
GameApi.prototype.createdTeam = function (mid) {
    this.sendMessage({
        mid: mid
    }, "connector.teamHandler.createdTeam");
}

/**
* 加入队伍
*/
GameApi.prototype.addTeam = function (tid) {
    this.sendMessage({
        tid: tid
    }, "connector.teamHandler.addTeam");
}

/**
* 离开队伍
*/
GameApi.prototype.leaveTeam = function () {
    this.sendMessage({}, "connector.teamHandler.leaveTeam");
}

/**
* 开始战斗
*/
GameApi.prototype.startCombat = function (cbatid) {
    this.sendMessage({ cbatid: cbatid }, 'connector.teamHandler.startCombat');
}

/**
* 回合操作
*
* @param type      类型 捕捉 1001 技能 1
* @param skill     操作 技能
* @param attack_id 目标
* @param tid       队伍ID?
*/
GameApi.prototype.roundOperating = function (type, skill, attack_id, mtid) {
    this.sendMessage({
        type: type,
        parm: skill,
        attack_id: attack_id,
        tid: mtid
    }, "connector.teamHandler.roundOperating");
}

/**
* 初始我得物品
*/
GameApi.prototype.getMyGoods = function (page) {
    this.sendMessage({
        page
    }, "connector.userHandler.getMyGoods");
}

/**
* 出售物品
*/
GameApi.prototype.playerSellGoods = function (ugid, price, count) {
    this.sendMessage({
        ugid: ugid,
        game_gold: price,
        count
    }, "connector.playerHandler.sellGoods");
}

/**
* 选择我的称号
*/
GameApi.prototype.selectMyTitle = function (index) {
    this.sendMessage({
        index
    }, "connector.userHandler.selectMyTitle");
}

/**
* 称号弹框
*/
GameApi.prototype.getMyTitle = function () {
    this.sendMessage({}, "connector.userHandler.getMyTitle");
}

/**
* 初始我得宠物
*/
GameApi.prototype.getMyPet = function () {
    this.sendMessage({}, "connector.userHandler.getMyPet");
}

/**
* 挖宝图
*/
GameApi.prototype.wbt = function (ugid) {
    this.sendMessage({
        ugid
    }, "connector.userHandler.wbt");
}

/**
* 领高级宝图任务
*/
GameApi.prototype.getCopyTask = function (tid) {
    this.sendMessage({
        tid
    }, "connector.playerHandler.getCopyTask");
}

/**
* 初始我得技能
*/
GameApi.prototype.getMySkill = function () {
    this.sendMessage({}, "connector.userHandler.getMySkill");
}

/**
* 修炼装备
*/
GameApi.prototype.repairUserArms = function (type) {
    this.sendMessage({
        type
    }, "connector.userHandler.repairUserArms");
}

/**
* 获取任务列表
*/
GameApi.prototype.getUserTask = function () {
    this.sendMessage({
    }, "connector.userHandler.getUserTask");
}

/**
* 使用物品
*/
GameApi.prototype.useGoods = function (gid) {
    this.sendMessage({
        gid
    }, "connector.userHandler.useGoods");
}

/**
* 更新角色信息
*/
GameApi.prototype.userInfo = function () {
    this.sendMessage({
    }, "connector.userHandler.userInfo");
}

/**
* 佩戴拆卸装备
*/
GameApi.prototype.wearUserEquipment = function (ueid) {
    this.sendMessage({
        ueid
    }, "connector.playerHandler.wearUserEquipment");
}

/**
* 完成任务
*/
GameApi.prototype.payUserTask = function (utid) {
    this.sendMessage({
        utid
    }, "connector.playerHandler.payUserTask");
}

/**
* 幻化宠物
*/
GameApi.prototype.turnIntoPet = function (pid) {
    this.sendMessage({
        pid
    }, "connector.userHandler.turnIntoPet");
}

/**
* 初始系统中出售物品
*/
GameApi.prototype.getSystemSellGoods = function (pageIndex) {
    this.sendMessage({
        pageIndex
    }, "connector.systemHandler.getSystemSellGoods");
}

/**
* 取回到背包
*/
GameApi.prototype.shelfMyGoods = function (id) {
    this.sendMessage({
        id: id
    }, "connector.userHandler.shelfMyGoods");
}

/**
* 初始仙坊集市
*/
GameApi.prototype.getPlayerSellGoods = function (pageIndex, type) {
    this.sendMessage({
        pageIndex: pageIndex ? pageIndex : 1,
        select: type
    }, "connector.playerHandler.getPlayerSellGoods");
}

/**
* 购买玩家物品
*/
GameApi.prototype.byPalyerGoods = function (id, type) {
    this.sendMessage({
        usgid: id, type
    }, "connector.playerHandler.byPalyerGoods");
}

/**
* 购买系统物品
*/
GameApi.prototype.byGoodsToSystem = function (type, id) {
    this.sendMessage({
        id, type
    }, "connector.playerHandler.byGoodsToSystem");
}

/**
* 初始任务中心
*/
GameApi.prototype.getSystemTask = function () {
    this.sendMessage({}, "connector.systemHandler.getSystemTask");
}

/**
* 合成物品
*/
GameApi.prototype.makeGoods = function (selectGoodsArr) {
    this.sendMessage({
        arr: selectGoodsArr
    }, "connector.userHandler.makeGoods");
}

/**
* 分解物品
*/
GameApi.prototype.userSellGoods = function (selectGoodsArr) {
    this.sendMessage({
        arr: selectGoodsArr
    }, "connector.userHandler.sellGoods");
}

/**
* 出战宠物
*/
GameApi.prototype.playUserPet = function (id, status) {
    this.sendMessage({
        pid: id,
        status
    }, "connector.userHandler.playUserPet");
}

/**
* 升级宠物  type==1升级  type==2分配潜力 type==3放生
*/
GameApi.prototype.upUserPetLevel = function (pid, type, point) {
    let parms = { pid: pid, type };
    if (type == 2) {
        point = point || {};
        Object.assign(parms, {
            str: point.str || null,
            int: point.int || null,
            agi: point.agi || null,
            vit: point.vit || null,
            con: point.con || null
        });
    }
    this.sendMessage(parms, "connector.userHandler.upUserPetLevel");
}

/**
* 发送消息
*/
GameApi.prototype.send = function (send_channel, send_msg) {
    this.sendMessage({
        send_channel,
        send_msg
    }, "chat.chatHandler.send");
}

/**
* 保存/分配属性点
*/
GameApi.prototype.allocationPoint = function (str, int, agi, vit, con) {
    this.sendMessage({
        str: str, // 力量
        int: int, // 智力
        agi: agi, // 敏捷
        vit: vit, // 耐力
        con: con  // 体质
    }, "connector.userHandler.allocationPoint");
}

/**
* 获取我得装备列表
*/
GameApi.prototype.getUserEqs = function () {
    this.sendMessage({}, "connector.userHandler.getUserEqs");
}

/**
* 更新玩家货币
*/
GameApi.prototype.updateUserPrice = function () {
    this.sendMessage({}, "connector.userHandler.updateUserPrice");
}

/**
* 显示我的团队
*/
GameApi.prototype.showMyTeam = function (is_show) {
    this.sendMessage({ is_show }, "connector.teamHandler.showMyTeam");
}

/**
* 排行榜?
* @param type 1=等级 2=兽宠 3=神兵
*/
GameApi.prototype.getRankList = function (type) {
    this.sendMessage({ type }, "connector.systemHandler.getRankList");
}

/**
* 初始聚仙阁楼页面
*/
GameApi.prototype.initFation = function () {
    this.sendMessage({}, "connector.fationHandler.initFation");
}

/**
* 创建工会
*/
GameApi.prototype.createFation = function (name) {
    this.sendMessage({
        name
    }, "connector.fationHandler.createFation");
}

/**
* 申请工会
*/
GameApi.prototype.applyForFation = function (fid) {
    this.sendMessage({
        fid
    }, "connector.fationHandler.applyForFation");
}


/**
* 同意入会
* @param type              1=同意 2=拒绝
* @param fation_apply_id
*/
GameApi.prototype.doneFationApply = function (type, fation_apply_id) {
    this.sendMessage({
        type, faid: fation_apply_id
    }, "connector.fationHandler.doneFationApply");
}

/**
* 升降职位
*/
GameApi.prototype.upUserFationLevel = function (type, uid) {
    this.sendMessage({
        type, uid
    }, "connector.fationHandler.upUserFationLevel");
}

/**
* 打开工会列表
*/
GameApi.prototype.getFationList = function () {
    this.sendMessage({}, "connector.fationHandler.getFationList");
}

/**
* 查看申请
*/
GameApi.prototype.getFationApply = function () {
    this.sendMessage({}, "connector.fationHandler.getFationApply");
}

/**
* 查看工会人员
*/
GameApi.prototype.showFationUserList = function () {
    this.sendMessage({}, "connector.fationHandler.showFationUserList");
}

/**
* 脱离工会
*/
GameApi.prototype.leaveFation = function () {
    this.sendMessage({}, "connector.fationHandler.leaveFation");
}

/**
* 点技能
*/
GameApi.prototype.upFationUserSkill = function (type) {
    this.sendMessage({
        type
    }, "connector.fationHandler.upFationUserSkill");
}

/**
* 捐赠
*/
GameApi.prototype.donateFationFunds = function () {
    this.sendMessage({}, "connector.fationHandler.donateFationFunds");
}

/**
* 领取任务
*/
GameApi.prototype.getFationTask = function () {
    this.sendMessage({}, "connector.fationHandler.getFationTask");
}

/**
* 升级工会
*/
GameApi.prototype.upFation = function (type) {
    this.sendMessage({
        type
    }, "connector.fationHandler.upFation");
}

/**
* 聚灵
*/
GameApi.prototype.polyLin = function (type) {
    this.sendMessage({
        type
    }, "connector.userHandler.polyLin");
}

/**
* 放弃任务
*/
GameApi.prototype.closeUserTask = function (tid) {
    this.sendMessage({
        tid: tid
    }, "connector.fationHandler.closeUserTask");
}

/**
* 整理
*/
GameApi.prototype.allSellGoods = function () {
    this.sendMessage({}, "connector.userHandler.allSellGoods");
}

/**
* 重置属性
*/
GameApi.prototype.resetAttribute = function () {
    this.sendMessage({}, "connector.userHandler.resetAttribute");
}

/**
* 预览合宠
*/
GameApi.prototype.getMyPet = function (a_id, b_id) {
    this.sendMessage({
        ids: a_id + "," + b_id
    }, "connector.userHandler.getMyPet");
}

/**
* 确认合成
*/
GameApi.prototype.fitPet = function (a_id, b_id) {
    this.sendMessage({
        ids: a_id + "," + b_id
    }, "connector.userHandler.fitPet");
}

/**
* 添加用户宠物技能?
*/
GameApi.prototype.addUserPetSkill = function (upid) {
    this.sendMessage({
        ugid, upid
    }, "connector.userHandler.addUserPetSkill");
}

/**
* 获取我的宠物用品?
*/
GameApi.prototype.getMyPetSkillGoods = function () {
    this.sendMessage({}, "connector.userHandler.getMyPetSkillGoods");
}

export default GameApi
