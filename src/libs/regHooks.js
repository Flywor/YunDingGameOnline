import GameApi from './YunDingOnlineSDK'

window.freshPackage = true
window.chatMsg = []
window.screens = []

// 暴露一个接口 用来接收 app 对象
export default function (_app) {
    const app = _app;

    function buildUserTasks (userTasks) {
        const taskList = []
        userTasks.map(task => {
            const give = []
            task.task.give_goods.map((gds, i) => {
                give.push(`${gds.name} x ${task.task.give_goods_num[i].count}`)
            })
            if (task.task.contribution_num) {
                give.push(`帮贡 ${task.task.contribution_num}`)
            }

            const need = []
            task.needGoods.map(gds => {
                need.push(`${gds.name} [${gds.have_count}/${gds.need_count}]`)
            })

            taskList.push({
                utid: task.utid,
                _id: task.task._id,
                title: task.task.name,
                info: task.task.info,
                give,
                need
            })
        })
        app.$set(app.user, 'userTasks', taskList);
    }

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
        buildUserTasks(data.data.userTasks);
        // 记录地图位置
        app.$set(user, 'map', data.data.map);
        // 获取一些初始化的信息
        this.userInfo();
        this.getSystemTask(); // 任务中心
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
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        // 更新地图位置
        app.$set(app.user, 'map', data.map);
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

        this.getTeamList(app.user.map.id)
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
            app.$delete(user, 'team')
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

        if (window.screens.length === 0) {
            window.screens.push(...data.data.screens);
        }

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
        this.getTeamList(app.user.map.id)
    }
    switchCombatScreenCb.hookMark = "regHooks.switchCombatScreenCb";
    GameApi.regHookHandlers['connector.teamHandler.switchCombatScreen'].push(switchCombatScreenCb);

    // 战斗开始
    let onStartBatCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        const user = app.user
        const battleUnit = data.data.initData
        
        let catchTarget
        if (user.catchType) {
            // 匹配捕捉带技能的宠物
            if (user.catchSkills && user.catchSkills.includes) {
                catchTarget = battleUnit.find(bu => {
                    return bu.skills.some(skl => user.catchSkills.includes(skl.name));
                })
            }
        } else {
            // 匹配捕捉的宠物名称
            if (user.catchPet && user.catchPet.includes) {
                catchTarget = battleUnit.find(bu => user.catchPet.includes(bu.name.replace(/<[^>]+>/g, '')))
            }
        }
        console.log(catchTarget, battleUnit)
        if (catchTarget) {
            this.roundOperating(
                '1001',
                '',
                catchTarget.id,
                user.team ? user.team._id : ''
            );
        } else {
            this.roundOperating(
                user.skilltype || '1',
                user.skillid || '1',
                '',
                user.team ? user.team._id : ''
            );
        }
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
        if (user.fighting && user.team) {
            this.startCombat(user.team.combat);
        }

        // 保存战斗消息
        app.setMessage(this.email, data.data);
        this.userInfo();
    }
    onRoundBatEndCb.hookMark = "regHooks.onRoundBatEndCb";
    GameApi.regHookHandlers['onRoundBatEnd'].push(onRoundBatEndCb);

    // 发送消息
    let chatSendCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
    }
    chatSendCb.hookMark = "regHooks.chatSendCb";
    GameApi.regHookHandlers['chat.chatHandler.send'].push(chatSendCb);

    // 接收消息
    let onChatMsgCb = function (data) {
        data.key = Date.now();
        window.chatMsg.push(data);
    }
    onChatMsgCb.hookMark = "regHooks.onChatMsgCb";
    GameApi.regHookHandlers['onChatMsg'].push(onChatMsgCb);

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
                    case '5eedd0178822d61cf3d9548b':
                        goodsType = '兽决';
                        break;
                    case '5eef5f0b0faad0b123d709d0':
                        goodsType = '大补丹';
                        break;
                    case '5eef5f0b0faad0b123d709d0':
                        goodsType = '大补丹';
                        break;
                    default:
                        console.log(`这个${good.goods_type}俺不知道`)
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
                    info: good.goods || good
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
        app.$Message.success(data.msg);

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

    // 仙蕴聚灵
    let polyLinCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        this.userInfo();
    }
    polyLinCb.hookMark = "regHooks.polyLinCb";
    GameApi.regHookHandlers['connector.userHandler.polyLin'].push(polyLinCb);

    // 整理回调
    let allSellGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    allSellGoodsCb.hookMark = "regHooks.allSellGoodsCb";
    GameApi.regHookHandlers['connector.userHandler.allSellGoods'].push(allSellGoodsCb);

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
        app.$set(app.user, 'skills', data.data.skill);

        const arms = [];
        const typeMap = {
            0: '剑', 1: '枪', 2: '锤', 3: '伞'
        };
        const levelMap = {
            0: { name: '入门', exp: 200 },
            1: { name: '精修', exp: 500 },
            2: { name: '意境', exp: 1500 },
            3: { name: '心境', exp: 3500 },
            4: { name: '解境', exp: 5000 },
            5: { name: '魂入体', exp: 30000 },
            6: { name: '灵出窍', exp: 100000 },
            7: { name: '神境', exp: 500000 }
        };
        data.data.arms_exp.map((exp, index) => {
            const typeName = typeMap[index];
            const level = levelMap[data.data.arms_level[index]];
            arms.push({ exp, needExp: level.exp, name: `${typeName}${level.name}` });
        });
        app.$set(app.user, 'arms', arms);
    }
    getMySkillCb.hookMark = "regHooks.getMySkillCb";
    GameApi.regHookHandlers['connector.userHandler.getMySkill'].push(getMySkillCb);

    // 升级主动技能
    let upLevelUserSkillCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg || `${data.code}错误但是没有错误信息，不知道作者搞什么鬼`);
            return;
        }
        this.getMySkill();
    }
    upLevelUserSkillCb.hookMark = "regHooks.upLevelUserSkillCb";
    GameApi.regHookHandlers['connector.playerHandler.upLevelUserSkill'].push(upLevelUserSkillCb);

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

    // 获取系统任务
    let getSystemTaskCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        const taskList = []
        data.data.list.map(task => {
            taskList.push({
                _id: task._id,
                title: task.name,
                info: task.info
            })
        })
        app.$set(app.user, 'systemTask', taskList);
    }
    getSystemTaskCb.hookMark = "regHooks.getSystemTaskCb";
    GameApi.regHookHandlers['connector.systemHandler.getSystemTask'].push(getSystemTaskCb);

    // 领取任务
    let getCopyTaskCb = function (data) {
        
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
        buildUserTasks(data.data)
    }
    getUserTaskCb.hookMark = "regHooks.getUserTaskCb";
    GameApi.regHookHandlers['connector.userHandler.getUserTask'].push(getUserTaskCb);

    // 完成任务回调
    let payUserTaskCb = function (data) {
        
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
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
        if (!app.user.wbtResult) {
            app.user.wbtResult = []
        }
        app.user.wbtResult.push(data.msg);
        if (data.code != 200) {
            app.$Message.error({
                background: true,
                content: data.msg
            });
            return;
        }
        app.$Message.success({
            background: true,
            content: data.msg
        });
        if (!window.freshPackage) return;
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    wbtCb.hookMark = "regHooks.wbtCb";
    GameApi.regHookHandlers['connector.userHandler.wbt'].push(wbtCb);
    // 合成物品回调
    let makeGoodsCb = function (data) {
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
    makeGoodsCb.hookMark = "regHooks.makeGoodsCb";
    GameApi.regHookHandlers['connector.userHandler.makeGoods'].push(makeGoodsCb);



    //获取宠物信息
    let getMyPetCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        app.$set(app.user, 'myPets', data.data.data);
    }
    getMyPetCb.hookMark = "regHooks.getMyPetCb";
    GameApi.regHookHandlers['connector.userHandler.getMyPet'].push(getMyPetCb);

    //宠物升级、加点，放生
    let upUserPetLevelCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }

        this.getMyPet()
    }
    upUserPetLevelCb.hookMark = "regHooks.upUserPetLevelCb";
    GameApi.regHookHandlers['connector.userHandler.upUserPetLevel'].push(upUserPetLevelCb);

    //宠物出战
    let playUserPetCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        if (data.data.name) {
            const msg = data.data.status ? `${data.data.name}参战成功` : `${data.data.name}休息成功`
            app.$Message.success(msg);
        }
        this.getMyPet()
    }
    playUserPetCb.hookMark = "regHooks.playUserPetCb";
    GameApi.regHookHandlers['connector.userHandler.playUserPet'].push(playUserPetCb);


    //宠物幻化
    let turnIntoPetCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(data.msg);
        this.getMyPet()
    }
    turnIntoPetCb.hookMark = "regHooks.turnIntoPetCb";
    GameApi.regHookHandlers['connector.userHandler.turnIntoPet'].push(turnIntoPetCb);

    //预览合宠
    let getNewPetCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(data.msg);
        this.getMyPet()
    }
    getNewPetCb.hookMark = "regHooks.getNewPetCb";
    GameApi.regHookHandlers['connector.userHandler.getNewPet'].push(getNewPetCb);

    //确认合宠
    let fitPetCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(data.msg);
        this.getMyPet()
    }
    fitPetCb.hookMark = "regHooks.fitPetCb";
    GameApi.regHookHandlers['connector.userHandler.fitPet'].push(fitPetCb);

    //打书
    let addUserPetSkillCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(data.msg);
        this.getMyPet()
    }
    addUserPetSkillCb.hookMark = "regHooks.addUserPetSkillCb";
    GameApi.regHookHandlers['connector.userHandler.addUserPetSkill'].push(addUserPetSkillCb);
   

    // 上架出售
    let playerSellGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        app.$Message.success(`${data.data.name} x ${data.data.sell.count}上架成功`);
        // 重置背包
        app.user.goods = [];
        app.user.goodsPage = 1;
        this.getMyGoods();
    }
    playerSellGoodsCb.hookMark = "regHooks.playerSellGoodsCb";
    GameApi.regHookHandlers['connector.playerHandler.sellGoods'].push(playerSellGoodsCb);


    // 获取市场物品
    let getPlayerSellGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        data.data.playerSellUser.map(sell => {
            app.user.market.list.push(sell);
        })
        if (app.user.market.list.length !== data.data.count) {
            setTimeout(() => {
                user.market.pageIndex++;
                this.getPlayerSellGoods(user.market.pageIndex, user.market.type);
            }, 1100)
        } else {
            const good_map_type = {};
            app.user.market.list.map(gds => {
                const name = gds.name || gds.goods.name;
                if (app.user.market.keyword && name.indexOf(app.user.market.keyword) === -1) {
                    return
                }

                if (!good_map_type[name]) {
                    good_map_type[name] = [];
                }

                good_map_type[name].push(gds);
            });

            const sellGoods = [];
            Object.keys(good_map_type).map(name => {
                sellGoods.push({
                    name,
                    count: good_map_type[name].length,
                    list: good_map_type[name].sort((n, m) => (n.sell_game_gold / n.count) - (m.sell_game_gold / m.count))
                });
            });
            app.$set(app.user.market, 'sellGoods', sellGoods);
            app.$Spin.hide();
        }
    }
    getPlayerSellGoodsCb.hookMark = "regHooks.getPlayerSellGoodsCb";
    GameApi.regHookHandlers['connector.playerHandler.getPlayerSellGoods'].push(getPlayerSellGoodsCb);

    //系统商城
    let getSystemSellGoodsCb = function (data) {
        if (data.code != 200) {
            app.$Message.error(data.msg);
            return;
        }
        const goods = data.data.goods;
        let shop = {
            shopPage: 0,
            goods: []
        }
        if (app.user.shop) {
            shop.shopPage = goods.length > 0 ? app.user.shop.shopPage + 1 : app.user.shop.shopPage-1;
            shop.goods = app.user.shop.goods.concat(goods);
        } 
        
        if (goods.length > 0) {
            this.getSystemSellGoods(shop.shopPage+1)
        }
        app.$set(app.user, 'shop', shop);
    }
    getSystemSellGoodsCb.hookMark = "regHooks.getSystemSellGoodsCb";
    GameApi.regHookHandlers['connector.systemHandler.getSystemSellGoods'].push(getSystemSellGoodsCb);
}