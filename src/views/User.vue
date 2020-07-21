<template>
  <div
    v-if="user"
    class="user"
  >
    <p>状态：{{user.status}}&nbsp;{{ user.status_msg && `${user.status_msg}` }}

      <Poptip
        word-wrap
        transfer
        placement="bottom"
      >
        <Button
          size="small"
          type="info"
        >
          查看收益
        </Button>
        <div
          class="fight-gains"
          slot="content"
        >
          <div v-if="!fightGains.beginTime">
            {{gains.tips}}
          </div>
          <ul v-else>
            <li>
              <span>开始时间:</span><span>{{gains.beginTime}}</span>
            </li>
            <li>
              <span>战斗时长:</span><span>{{gains.fightTime}}</span>
            </li>
            <li>
              <span>获得经验:</span><span>{{gains.gainExp}}</span>
            </li>
            <li class="goods">
              <div>获得物品:</div>
              <ul>
                <li
                  v-for="(value,key) in gains.goods"
                  :key="key"
                ><span>{{key}}:</span><span>{{value}}</span>
                </li>
              </ul>
            </li>
            <li>
              <span>战斗回合数:</span><span>{{gains.roundCount}}</span>
            </li>
            <li>
              <span>战斗场数:</span><span>{{gains.fightCount}}</span>
            </li>
            <li>
              <span>经验/分钟:</span><span>{{gains.avgExp}}</span>
            </li>
            <li>
              <span>战斗场数/分钟:</span><span>{{gains.avgFightCount}}</span>
            </li>
          </ul>
        </div>
      </Poptip>
    </p>

    <!-- 战斗统计 ↑ -->
    <template v-if="user.myInfo">
      <div class="br" />
      <p>
        LV.{{user.myInfo.level}}&nbsp;
        <a
          v-if="user.myInfo.exp > user.myInfo.nextExp"
          @click="game.upPlayerLevel()"
        >升级</a>
        &nbsp;
        EXP：{{ Math.floor(user.myInfo.exp) }}/{{ Math.floor(user.myInfo.nextExp) }}
        &nbsp;
        <Poptip
          v-if="user.myInfo.potential_num > 0"
          transfer
          placement="bottom"
        >
          <Button
            size="small"
            type="info"
          >
            加点
          </Button>
          <div slot="content">
            <a
              @click="handleAllocationPoint(1)"
              size="small"
            >
              全力加点
            </a>
            <a
              @click="handleAllocationPoint(2)"
              size="small"
            >
              全魔加点
            </a>
          </div>
        </Poptip>
        &nbsp;
        <Poptip
          v-if="user.myInfo.game_silver > 1000000"
          transfer
          placement="bottom"
        >
          <Button
            size="small"
            type="info"
          >
            点技能
          </Button>
          <div slot="content">
            <a
              @click="handleFationSkill(1)"
              size="small"
            >
              剑修五十级
            </a>
            <a
              @click="handleFationSkill(2)"
              size="small"
            >
              枪修五十级
            </a>
          </div>
        </Poptip>
      </p>
      <div class="br" />
      <p>
        财产：{{ Math.floor(user.myInfo.game_gold) }}仙石
        &nbsp;
        {{ Math.floor(user.myInfo.game_silver) }}灵石
        &nbsp;
        <Button
          size="small"
          type="info"
          @click="openBag"
        >
          {{opened?"关闭":"物品栏"}}
        </Button>

      </p>
      <div class="br" />
      <p>
        气血储备：{{ Math.floor(user.myInfo.hp_store) }}&nbsp;魔法储备：{{ Math.floor(user.myInfo.mp_store) }}
      </p>
    </template>
    <!-- 挖宝 ↓ -->
    <template>
      <div class="br" />
      <template v-if="unusecbt">
        <template v-if="unusecbt.normal">
          检测到你有
          <span style="color: red">{{unusecbt.normal.num}}</span>
          张没鉴定的
          <span style="color: red">藏宝图</span>
          [<a @click="() => {
            game.useGoods(unusecbt.normal.id)
          }">鉴定一张</a>]
          <template v-if="unusecbt.normal.num >= 12">
            <div class="br" />
            <a
              v-if="hightcbtTask"
              @click="game.payUserTask(hightcbtTask.utid)"
            >
              完成
            </a>
            <a
              v-else
              @click="game.getCopyTask(hightcbtTaskId)"
            >
              领取
            </a>
            高级宝图任务
          </template>
        </template>
        <template v-if="unusecbt.high">
          检测到你有
          <span style="color: red">{{unusecbt.high.num}}</span>
          张没鉴定的
          <span style="color: red">高级藏宝图</span>
          [<a @click="() => {
            game.useGoods(unusecbt.high.id)
          }">鉴定一张</a>]
        </template>
      </template>
    </template>
    <template v-if="waBao.length > 0">
      <div class="br" />
      检测到你在
      <span style="color: green">{{waBao.map(wb => wb.name).join('，')}}</span>
      有藏宝图
      &nbsp;
      <template v-if="currentWaBao">
        ，巧了，刚好有一张{{currentWaBao.name}}
        <Button
          @click="() => {
          game.wbt(currentWaBao.btId)
        }"
          size="small"
          type="info"
        >
          挖宝
        </Button>
      </template>
    </template>
    <!-- 挖宝 ↑ -->
    <!-- 地图 ↓ -->
    <template v-if="user.map">
      <div class="br" />
      地图：
      <Button
        v-if="user.team"
        size="small"
        type="info"
        disabled
      >
        {{ user.map.name }}
      </Button>
      <Poptip
        v-else
        transfer
        placement="bottom"
      >
        <Button
          size="small"
          type="info"
        >
          {{ user.map.name }}
        </Button>
        <div slot="content">
          <p
            v-for="item in toMap"
            :key="item.id"
          >
            <a
              @click="() => {
              game.moveToNewMap(item.id);
            }"
              size="small"
              style="width: 100%;"
            >
              {{item.name}}
            </a>
          </p>
        </div>
      </Poptip>
    </template>
    <!-- 地图 ↑ -->
    <!-- 副本 ↓ -->
    <template v-if="user.team && user.team.leader === user.email">
      <div class="br" />
      副本：
      <Poptip
        transfer
        placement="bottom"
      >
        <Button
          size="small"
          type="info"
        >
          {{ user.combatName || '未选择' }}
        </Button>
        <div slot="content">
          <p
            v-for="item in user.screens"
            :key="item._id"
          >
            <a
              @click="() => {
              user.team.combat = item._id;
              game.switchCombatScreen(item._id);
            }"
              size="small"
              style="width: 100%;"
            >
              {{item.name}}
            </a>
          </p>
        </div>
      </Poptip>
    </template>
    <!-- 副本 ↑ -->
    <div class="br" />
    <!-- 组队 ↓ -->
    队伍：
    <template v-if="user.team && user.team.leader === user.email">
      [{{ user.team.users.length || 1 }}/5]
      <Button
        @click="game.leaveTeam()"
        size="small"
        type="error"
      >
        解散
      </Button>
      &nbsp;
      <i-switch
        v-model="user.fighting"
        :disabled="!user.combatName"
        true-color="#13ce66"
        false-color="#ff4949"
        @on-change="flag => {
          user.fighting && game.startCombat(user.team.combat)
        }"
        size="large"
      >
        <span slot="open">战斗</span>
        <span slot="close">平时</span>
      </i-switch>
    </template>
    <template v-else-if="user.team">
      队长[{{user.team.leader}}]
      <Button
        size="small"
        type="warning"
        @click="game.leaveTeam()"
      >
        离开
      </Button>
    </template>
    <template v-else>
      <Button
        @click="game.createdTeam(user.map.id)"
        size="small"
        type="success"
      >
        创建
      </Button>
      &nbsp;
      <Poptip
        transfer
        placement="bottom"
      >
        <Button
          size="small"
          type="success"
          @click="game.getTeamList(user.map.id)"
        >
          加入
        </Button>
        <div slot="content">
          <p
            v-for="item in user.teams"
            :key="item._id"
          >
            <a
              @click="game.addTeam(item._id)"
              size="small"
              style="width:100%;"
            >
              {{item.leader.nickname}}&nbsp;({{item.leader.level}})&nbsp;[{{item.users.length}}/{{(item.combat || {}).player_num}}]
            </a>
          </p>
        </div>
      </Poptip>
    </template>
    <!-- 组队 ↑ -->
    <div class="br" />
    <!-- 技能 ↓ -->
    技能：
    <Poptip
      transfer
      placement="bottom"
      v-if="user.skills"
    >
      <Button
        size="small"
        type="default"
      >
        {{user.skillname || '物理攻击'}}
      </Button>
      <div slot="content">
        <template v-if="user.skills.length === 0">
          没技能
        </template>
        <template v-else>
          <p
            v-for="item in user.skills"
            :key="item._id"
          >
            <a
              @click="() => {
              $set(user, 'skillid', item._id);
              $set(user, 'skillname', item.name);
            }"
              style="width:100%;"
            >
              {{item.name}}
            </a>
          </p>
        </template>
      </div>
    </Poptip>
    <!-- 技能 ↑ -->
    <div class="br" />
    <!-- 战斗信息 ↓ -->
    <div v-if="'object' == typeof user.message">
      [{{ user.message.time }}]
      &nbsp;
      {{'第' + user.message.round_num + '轮'}}
      &nbsp;
      <div
        style="display:inline-block"
        v-html="user.message.msg.join(',')"
      />
    </div>
    <!-- 战斗信息 ↑ -->
    <div
      v-if="opened"
      class="goods"
    >
      <span
        class="grid"
        v-for="item in goods"
        :key=item.id
      >
        <span>
          {{item.name}}
        </span>
        <span>
          {{item.num}}
        </span>
      </span>
    </div>
    <!-- 包包 ↑-->
  </div>

</template>

<script>
let messageTime;
import GameApi from "@libs/YunDingOnlineSDK.js";
import regHooks from "@libs/regHooks.js";
import configData from "@/config.js";
import { sleep } from "@libs/tools";
export default {
  name: "User",
  data() {
    return {
      game: {},
      user: null,
      config: configData,
      hightcbtTaskId: "5f01ee501a863c76d650525c",
      opened: false,
      fightGains: {
        goods: {}, //战利品
        gainExp: 0, //获得经验
        beginTime: 0, //开始时间
        roundCount: 0, //回合数
        fightCount: 0 //战斗场数
      }
    };
  },
  watch: {
    user: {
      deep: true,
      handler(user) {
        let combatName = null;
        if (user && user.screens && user.team) {
          if (user.team.combat) {
            const combat = user.screens.find(
              scr => scr._id === user.team.combat
            );
            if (combat) combatName = combat.name;
          }
        }
        user.combatName = combatName;
        this.saveStorageUserInfo(user);
      }
    }
  },
  computed: {
    toMap() {
      const user = this.user;
      const maps = configData.maps;
      if (user && user.map) {
        const { up, next } = maps.find(mp => mp.id === user.map.id);
        const toMaps = [...up, ...next].map(id => {
          const name = maps.find(mp => mp.id === id).name;
          return { id, name };
        });
        return toMaps;
      } else {
        return [];
      }
    },
    waBao() {
      const goods = this.user.goods;
      const maps = configData.maps;
      if (!goods) return [];
      const btMaps = goods
        .filter(gds => !!gds.map)
        .map(gds => ({
          id: gds.map,
          btId: gds.id,
          name: maps.find(mp => mp.id === gds.map).name
        }));
      return btMaps;
    },
    currentWaBao() {
      return this.waBao.find(wb => wb.id === this.user.map.id);
    },
    unusecbt() {
      const goods = this.user.goods;
      if (!goods) return null;
      const unuse = goods.filter(gds => gds.unusecbt);
      if (unuse.length === 0) return null;
      const unusecbt = {
        normal: unuse.find(usc => !usc.highcbt),
        high: unuse.find(usc => usc.highcbt)
      };
      return unusecbt;
    },
    hightcbtTask() {
      const userTasks = this.user.userTasks;
      if (!userTasks) return null;
      return this.user.userTasks.find(
        ust => ust.task._id === this.hightcbtTaskId
      );
    },
    //背包
    goods() {
      return this.user.goods;
    },
    gains() {
      //战斗时长 s
      const endTime = Date.now();
      const time = (endTime - this.fightGains.beginTime) / 1000;

      const h = Math.floor(time / 3600);
      const m = Math.floor((time / 60) % 60);
      const s = Math.ceil(time % 60);

      const fightTime = `${h}小时${m}分${s}秒`;

      const avgExp = Math.floor((this.fightGains.gainExp / time) * 60);
      const avgFightCount = ((this.fightGains.fightCount / time) * 60).toFixed(
        1
      );
      return {
        goods: this.fightGains.goods, //战利品
        gainExp: this.fightGains.gainExp, //获得经验
        beginTime: new Date(this.fightGains.beginTime)
          .toTimeString()
          .slice(0, 8), //开始时间
        roundCount: this.fightGains.roundCount, //回合数
        fightCount: this.fightGains.fightCount, //战斗场数
        fightTime: fightTime, //战斗时长
        //endTime: endTime, //结束时间
        avgExp: avgExp, //经验/分
        avgFightCount: avgFightCount, //战斗场数/分

        tips: "暂无收益，请开启战斗"
      };
    }
  },
  mounted() {
    regHooks(this);
    const { email, password } = this.$route.params;
    this.initUser(email, password);

    // 每隔1分钟检测有没有战斗信息更新
    setInterval(() => {
      const now = Date.now();
      if (now - messageTime > 30000) {
        window.location.reload();
      }
    }, 60000);
  },
  methods: {
    /**
     * 将技能保存到 localStorage 中
     * @param {*} 用户的所有信息
     */
    saveStorageUserInfo: function(user) {
      localStorage.setItem(
        user.email,
        JSON.stringify({
          fighting: user.fighting,
          email: user.email,
          skillid: user.skillid,
          skillname: user.skillname
        })
      );
    },
    /**
     * 从 localStorage 中取出用户技能
     */
    getStorageUserInfo: function(email) {
      const user = localStorage.getItem(email);
      if (user) {
        return JSON.parse(user);
      }
    },
    /**
     * 添加一个用户到列表
     *
     * @param {*} email
     * @param {*} password
     */
    initUser: function(email, password) {
      // 创建游戏对象
      const game = new GameApi();
      // 加载技能数据
      const user = this.getStorageUserInfo(email) || {
        email,
        status: "已添加",
        teams: [],
        fighting: false
      };

      // 游戏对象保存起来
      this.game = game;

      // 添加到用户列表
      this.user = user;

      // 登录账号
      game.login(email, password);
    },
    // 设置消息
    setMessage: function(email, data) {
      messageTime = Date.now();
      data.time = this.getDateTime();
      //记录战斗开始时间
      this.fightGains.beginTime = this.fightGains.beginTime || messageTime;
      //回合数+1
      this.fightGains.roundCount++;
      const msg = data.round_arr.find(dr => dr.a_name === email);
      data.msg = [
        msg
          ? `${email}使用了[${msg.process}]造成了[${msg.hurt
              .map(Math.floor)
              .join(",")}]伤害`
          : ""
      ];

      if (data.die_arr && data.die_arr.length) {
        data.msg.push(data.die_arr.map(da => `${da}卒`).join(","));
      }

      if (data.win === 1) {
        data.exp.forEach(item => {
          if (item.name == email) {
            data.msg.push(`获得经验[${item.exp || "没经验了"}]`);
            this.fightGains.gainExp += Math.floor(item.exp);
            this.fightGains.fightCount++;
          }
        });
        data.player_reward.forEach(item => {
          if (item.name == email) {
            if (item.mark) {
              data.msg.push(item.mark);
            } else {
              let reward = [];
              item.goods.forEach(good => {
                reward.push(good.gname);
              });
              if (reward.length > 0) {
                data.msg.push(`战利品[${reward.join(",")}]`);
                //获取战利品后,添加更新背包的状态
                this.user.updateGoods = true;
                //合并，更新战利品
                reward.forEach(ele => {
                  this.fightGains.goods.hasOwnProperty(ele)
                    ? this.fightGains.goods[ele]++
                    : (this.fightGains.goods[ele] = 1);
                });
              }
            }
          }
        });
      }
      if (data.win === 2) {
        data.msg.push("死亡");
        this.fightGains.fightCount++;
      }

      this.$set(this.user, "message", data);
    },
    handleAllocationPoint(type) {
      const pointNum = this.user.myInfo.potential_num;
      // 全力
      if (type === 1) {
        this.game.allocationPoint(pointNum, 0, 0, 0, 0);
      }
      // 全魔
      if (type === 2) {
        this.game.allocationPoint(0, pointNum, 0, 0, 0);
      }
    },
    async handleFationSkill(type) {
      this.$Message.info("正在自动连点技能，完成后会提示");
      for (let i = 0; i < 50; i++) {
        // 剑修
        if (type === 1) {
          this.game.repairUserArms(1);
        }
        // 枪修
        if (type === 2) {
          this.game.repairUserArms(2);
        }
        await sleep(100);
      }
      this.game.userInfo();
      this.$Message.info("技能修炼完成");
    },
    getDateTime() {
      let date = new Date();
      return "H:i:s".replace(/[His]/g, full => {
        let str = "";
        switch (full) {
          case "H":
            str = date.getHours();
            break;
          case "i":
            str = date.getMinutes();
            break;
          case "s":
            str = date.getSeconds();
            break;
          default:
            break;
        }
        return str.toString().padStart(2, "0");
      });
    },
    //打开背包
    openBag() {
      console.log();
      this.opened = !this.opened;
      //更新背包状态为 true 且 opened 为true时 ，重置背包
      if (this.user.updateGoods && this.opened) {
        this.user.updateGoods = false;
        this.user.goods = [];
        this.user.goodsPage = 1;
        this.game.getMyGoods();
      }
    }
  }
};
</script>
<style lang="less" scoped>
.user {
  width: 100%;
  height: 100%;
  p {
    display: flex;
    justify-content: space-between;
  }

  .br {
    height: 5px;
    width: 100%;
  }
  .goods {
    display: flex;
    flex-wrap: wrap;
    .grid {
      width: 50%;
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
      border: 1px solid #d2d6d8;
    }
  }
}
.fight-gains {
  ul {
    li {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .goods {
      flex-direction: column;
      li {
        padding: 2px 0 2px 10px;
        color: #42b983;
      }
    }
  }
}
</style>
