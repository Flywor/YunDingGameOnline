import GameApi from './YunDingOnlineSDK'

window.freshPackage = true

// 暴露一个接口 用来接收 app 对象
export default function (_app) {
    const app = _app;

    // 创建空函数 屏蔽 onLeave onAdd 消息刷屏
    let emptyCb = () => {};
    emptyCb.hookMark = 'regHooks.emptyCb';
    GameApi.regHookHandlers['onLeave'].push(emptyCb);
    GameApi.regHookHandlers['onAdd'].push(emptyCb);

    // 接管登录成功的回调
    let loginCb = function (data) {
        let user = app.user;
        // 检查错误
        if (data.code == 500) {
            user.status = "登录失败";
            user.status_msg = "账号已在他处登录";
            return;
        } else if (data.code != 200) {
            user.status = "登录失败";
            user.status_msg = data.msg || '未知错误';
            return;
        }

        // 登录成功
        if (data.token) {
            user.status = '鉴权成功';
            return;
        }
        user.status = '登录成功';

        // 没有数据就不在继续了
        if ('object' != typeof data.data) {
            return;
        }

        app.$set(user, 'userEqs', data.data.userEqs);
        app.$set(user, 'myInfo', data.data.myInfo);
        app.$set(user, 'userTasks', data.data.userTasks);
        // 记录地图位置
        app.$set(user, 'map', data.data.map);

        // 获取一些初始化的信息
        this.userInfo();
        // 获取地图队伍列表
        this.getTeamList(app.user.map.id);
        // 获取物品信息
        app.$set(user, 'goods', []);
        app.$set(user, 'goodsPage', 1);
        this.getMyGoods();
        // 获取技能信息
        this.getMySkill();
    }
    loginCb.hookMark = "regHooks.loginCb";
    GameApi.regHookHandlers['gate.gateHandler.queryEntry'].push(loginCb);
    GameApi.regHookHandlers['connector.loginHandler.login'].push(loginCb);

    // 移动地图的返回
    let moveToNewMapCb = function (data) {
        let user = app.user;

        // 更新地图位置
        app.$set(user, 'map', data.map);
    };
    moveToNewMapCb.hookMark = "regHooks.moveToNewMapCb";
    GameApi.regHookHandlers['connector.playerHandler.moveToNewMap'].push(moveToNewMapCb);

    // 创建队伍回调
    let createdTeamCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        // 保存队长信息
        app.$set(app.user, 'team', {
            leader: this.email,
            users: []
        });

        app.$Message.success('队伍创建成功');
    }
    createdTeamCb.hookMark = "regHooks.createdTeamCb";
    GameApi.regHookHandlers['connector.teamHandler.createdTeam'].push(createdTeamCb);

    // 离开队伍的回调
    let leaveTeamCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$delete(app.user, 'team');
        app.$Message.info('已离开队伍');

        app.game.getTeamList(app.user.map.id)
    }
    leaveTeamCb.hookMark = "regHooks.leaveTeamCb";
    GameApi.regHookHandlers['connector.teamHandler.leaveTeam'].push(leaveTeamCb);

    // 加入队伍
    let addTeamCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        // 整理结构
        let combat = data.data.combat || null,
            leader = data.data.users[0].nickname,
            users = data.data.users;

        for (let i = 0; i < this.user_info.screens.length; i++) {
            const screen = this.user_info.screens[i];
            if (screen._id == combat) {
                combat = screen.name;
            }
        }

        app.$set(app.user, 'team', {
            combat: combat,
            leader: leader,
            users: users
        });
        app.$Message.info('已加入队伍');
    }
    addTeamCb.hookMark = "regHooks.addTeamCb";
    GameApi.regHookHandlers['connector.teamHandler.addTeam'].push(addTeamCb);

    // 重新接收队伍信息
    let onMyTeamReloadCb = function (data) {
        if (data.code && data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        let user = app.user;

        // 队员退出
        if (data.new_uid && !data.team && user.team) {
            // 移除队员
            user.team.users.forEach((item, index) => {
                if (item._id == data.new_uid) {
                    user.team.users.splice(index, 1);
                }
            });
            return;
        }
        if (data.data || !data.team) {
            if (data.data) {
                app.$set(user, 'fighting', false)
            }
            app.$delete(usner, 'team')
            app.$delete(user, 'combatName')
            return;
        }

        // 获取队长信息
        let leader = data.team.leader,
            users = [];

        for (let i = 0; i < data.team.users.length; i++) {
            const user = data.team.users[i];
            if (user._id == leader) {
                leader = user.email;
            }
            users.push({
                _id: user._id,
                email: user.email,
                level: user.level
            })
        }

        app.$set(user, 'team', {
            leader: leader,
            users: users,
            combat: data.team.combat
        });

        if (user.email === leader && app.user.fighting) {
            this.startCombat(data.team.combat);
        }
    }
    onMyTeamReloadCb.hookMark = "regHooks.onMyTeamReloadCb";
    GameApi.regHookHandlers['onMyTeamReload'].push(onMyTeamReloadCb);

    // 获取队伍列表
    let getTeamListCb = function (data) {

        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        let user = app.user;

        app.$set(user, 'screens', data.data.screens);
        app.$set(user, 'teams', data.data.teams.filter(ts => ts.users.length !== ((ts.combat || {}).player_num)));
    }
    getTeamListCb.hookMark = "regHooks.getTeamListCb";
    GameApi.regHookHandlers['connector.teamHandler.getTeamList'].push(getTeamListCb);

    // 切换场景回调
    let switchCombatScreenCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        app.$Message.success("切换副本成功");
        app.game.getTeamList(app.user.map.id)
    }
    switchCombatScreenCb.hookMark = "regHooks.switchCombatScreenCb";
    GameApi.regHookHandlers['connector.teamHandler.switchCombatScreen'].push(switchCombatScreenCb);

    // 战斗开始
    let onStartBatCb = function (data) {
        const user = app.user
        this.roundOperating(user.skilltype || '1', user.skillid || '1', '', user.team._id);
    }
    onStartBatCb.hookMark = "regHooks.onStartBatCb";
    GameApi.regHookHandlers['onStartBat'].push(onStartBatCb);

    // 战斗结束
    let onRoundBatEndCb = function (data) {
        // 开启新的战斗
        // data.data.win 判断战斗结果
        const user = app.user
        if (user.myInfo.hp_store < 5000) {
            this.byGoodsToSystem(2, '5eef5b6e0faad0b123d709c5');
        }
        if (user.myInfo.mp_store < 5000) {
            this.byGoodsToSystem(2, '5eef5d140faad0b123d709c6');
        }
        if (user.fighting) {
            this.startCombat(user.team.combat);
        }

        // 保存战斗消息
        app.setMessage(this.email, data.data);
        this.userInfo();
    }
    onRoundBatEndCb.hookMark = "regHooks.onRoundBatEndCb";
    GameApi.regHookHandlers['onRoundBatEnd'].push(onRoundBatEndCb);

    // 回合操作
    let roundOperatingCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
    }
    roundOperatingCb.hookMark = "regHooks.roundOperatingCb";
    GameApi.regHookHandlers['connector.teamHandler.roundOperating'].push(roundOperatingCb);

    // 获取我的背包物品
    let getMyGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        let flag = true;
        for (let i = 0; i < data.data.goods.length; i++) {
            const good = data.data.goods[i];
            if (flag && good.goods && good.goods.info && good.goods.info.indexOf('储备值') > -1) {
                this.useGoods(good._id);
                flag = false;
            } else {
                let map, unusecbt, highcbt, goodsType
                // 转换物品类型
                switch (good.goods_type) {
                    case '5eee25a1ba4d0b4c4ef605d0':
                        goodsType = '蛋';
                        break;
                    case '5ec63cc24947081a6cd8d3a6':
                        goodsType = '未鉴定的装备';
                        break;
                    case '5e77ee52b1012a6374d2bd1b':
                        goodsType = '可装备的装备';
                        break;
                    case '5f01e52c0f80941f56ecc1ae':
                        goodsType = '藏宝图';
                        break;
                    case '5ef04600544717379c820835':
                        goodsType = '技能书';
                        break;
                    case '5ec63cb54947081a6cd8d3a5':
                        goodsType = '材料';
                        break;
                    case '5f01e4990f80941f56ecc1ac':
                        goodsType = '法宝材料';
                        break;
                    case '5eedd0138822d61cf3d9548a':
                        goodsType = '兽决';
                        break;
                    case '5eef5f0b0faad0b123d709d0':
                        goodsType = '大补丹';
                        break;
                    default:
                        goodsType = `这个${good.goods_type}俺不知道`;
                        break;
                }

                // 解析宝图位置
                if (good.name && good.expand) {
                    map = JSON.parse(good.expand).map
                } else if ((good.name || good.goods.name).indexOf('藏宝图') > -1) {
                    if ((good.name || good.goods.name).indexOf('高级藏宝图') > -1) {
                        highcbt = true
                    }
                    unusecbt = true
                }
               
                app.user.goods.push({
                    id: good._id,
                    num: good.count,
                    map,
                    unusecbt,
                    highcbt,
                    name: good.name || good.goods.name,
                    goodsType,
                    info:good.goods || good
                });
            }
        }

        if (app.user.goods.length !== data.data.count) {
            this.getMyGoods(++app.user.goodsPage);
        }
    }
    getMyGoodsCb.hookMark = "regHooks.getMyGoodsCb";
    GameApi.regHookHandlers['connector.userHandler.getMyGoods'].push(getMyGoodsCb);

    // 购买蓝药血药
    let byGoodsToSystemCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success('正在自动补气补蓝');

        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    byGoodsToSystemCb.hookMark = "regHooks.byGoodsToSystemCb";
    GameApi.regHookHandlers['connector.playerHandler.byGoodsToSystem'].push(byGoodsToSystemCb);

    // 使用物品回调
    let useGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        if (!window.freshPackage) return;
        this.userInfo();
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    useGoodsCb.hookMark = "regHooks.useGoodsCb";
    GameApi.regHookHandlers['connector.userHandler.useGoods'].push(useGoodsCb);

    // 分解物品回调
    let sellGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.userInfo();
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    useGoodsCb.hookMark = "regHooks.sellGoodsCb";
    GameApi.regHookHandlers['connector.userHandler.sellGoods'].push(sellGoodsCb);

    // 佩戴拆卸装备
    let wearUserEquipmentCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.userInfo();
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    useGoodsCb.hookMark = "regHooks.wearUserEquipmentCb";
    GameApi.regHookHandlers['connector.playerHandler.wearUserEquipment'].push(wearUserEquipmentCb);

    // 升级回调
    let upPlayerLevelCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.userInfo();
    }
    upPlayerLevelCb.hookMark = "regHooks.upPlayerLevelCb";
    GameApi.regHookHandlers['connector.userHandler.upPlayerLevel'].push(upPlayerLevelCb);

    // 获取用户信息
    let userInfoCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        data.user.nextExp = data.nextLevelGetExp
        let user = app.user;
        app.$set(user, 'myInfo', data.user);
    }
    userInfoCb.hookMark = "regHooks.userInfoCb";
    GameApi.regHookHandlers['connector.userHandler.userInfo'].push(userInfoCb);

    // 获取用户技能
    let getMySkillCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$set(app.user, 'skills', data.data.skill)
    }
    getMySkillCb.hookMark = "regHooks.getMySkillCb";
    GameApi.regHookHandlers['connector.userHandler.getMySkill'].push(getMySkillCb);

    // 分配属性点回调
    let allocationPointCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.userInfo();
    }
    allocationPointCb.hookMark = "regHooks.allocationPointCb";
    GameApi.regHookHandlers['connector.userHandler.allocationPoint'].push(allocationPointCb);

    // 领取高级宝图任务
    let getCopyTaskCb = function (data) {
        console.log(data)
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.getUserTask();
    }
    getCopyTaskCb.hookMark = "regHooks.getCopyTaskCb";
    GameApi.regHookHandlers['connector.playerHandler.getCopyTask'].push(getCopyTaskCb);

    // 获取任务列表
    let getUserTaskCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$set(app.user, 'userTasks', data.data);
    }
    getUserTaskCb.hookMark = "regHooks.getUserTaskCb";
    GameApi.regHookHandlers['connector.userHandler.getUserTask'].push(getUserTaskCb);

    // 完成任务回调
    let payUserTaskCb = function (data) {
        console.log(data)
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success('成功领到高级藏宝图，正在刷新背包');
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
        this.getUserTask();
    }
    payUserTaskCb.hookMark = "regHooks.payUserTaskCb";
    GameApi.regHookHandlers['connector.playerHandler.payUserTask'].push(payUserTaskCb);

    // 挖宝图回调
    let wbtCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(data.msg);

        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    wbtCb.hookMark = "regHooks.wbtCb";
    GameApi.regHookHandlers['connector.userHandler.wbt'].push(wbtCb);
}