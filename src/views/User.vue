<template>
  <div
    v-if="user"
    class="user"
  >
    <p>
      状态：{{user.status}}&nbsp;{{ user.status_msg && `${user.status_msg}` }}
      <ButtonGroup size="small">
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '装备信息';
            modalType = 'Eqs';
            showModal = true;
          }"
        >
          装备
        </Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '人物属性';
            modalType = 'Userinfo';
            showModal = true;
          }"
        >
          属性
        </Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '战斗收益';
            modalType = 'Gains';
            showModal = true;
          }"
        >
          收益
        </Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '宠物信息';
            modalType = 'Pet';
            showModal = true;
          }"
        >宠物</Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '人物技能';
            modalType = 'Skills';
            showModal = true;
          }"
        >技能</Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '任务中心';
            modalType = 'Tasks';
            showModal = true;
          }"
        >任务</Button>
        <Button
          size="small"
          type="info"
          @click="() => {
            modalTitle = '市场';
            modalType = 'Market';
            showModal = true;
          }"
        >市场</Button>
      </ButtonGroup>
    </p>
    <template v-if="user.myInfo">
      <div class="br" />
      <p>
        LV.{{user.myInfo.level}}&nbsp;
        [{{ Math.floor(user.myInfo.exp) }}/{{ Math.floor(user.myInfo.nextExp) }}]
        &nbsp;
        <a
          v-if="user.myInfo.exp > user.myInfo.nextExp"
          @click="game.upPlayerLevel()"
        >升级</a>
        &nbsp;
        <Dropdown v-if="user.myInfo.potential_num > 0" trigger="click">
          <Button
            size="small"
            type="info"
          >
            加点
          </Button>
          <DropdownMenu slot="list">
            <DropdownItem
              @click.native="handleAllocationPoint(1)"
            >全力加点</DropdownItem>
            <DropdownItem
              @click.native="handleAllocationPoint(2)"
            >全魔加点</DropdownItem>
          </DropdownMenu>
        </Dropdown>
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
          @click="() => {
            modalTitle = '储物戒指';
            modalType = 'Bag';
            showModal = true;
          }"
        >
          储物戒指
        </Button>
      </p>
      <div class="br" />
      <p>
        气血储备：{{ Math.floor(user.myInfo.hp_store) }}
        &nbsp;魔法储备：{{ Math.floor(user.myInfo.mp_store) }}
        &nbsp;活力：{{ Math.floor(user.myInfo.vitality_num) }}
        &nbsp;<a @click="game.polyLin(3)">仙蕴转活力</a>
      </p>
    </template>
    <!-- 挖宝 ↓ -->
    <template v-if="unusecbt">
      <template v-if="unusecbt.normal">
        <div class="br" />
        检测到你有
        <span style="color: red">{{unusecbt.normal.num}}</span>
        张没鉴定的
        <span style="color: red">藏宝图</span>
        [<a @click="() => {
          game.useGoods(unusecbt.normal.id)
        }">鉴定一张</a>]
        [<a @click="() => {
          readToUse = {
            useNum: unusecbt.normal.num,
            id: unusecbt.normal.id,
            name: '藏宝图'
          };
          handleUseItem()
        }">全部鉴定</a>]
      </template>
      <template v-if="unusecbt.high">
        <div class="br" />
        检测到你有
        <span style="color: red">{{unusecbt.high.num}}</span>
        张没鉴定的
        <span style="color: red">高级藏宝图</span>
        [<a @click="() => {
          readToUse = {
            useNum: unusecbt.high.num,
            id: unusecbt.high.id,
            name: '高级藏宝图'
          };
          handleUseItem();
        }">全部鉴定</a>]
      </template>
    </template>
    <template v-if="waBao.length > 0">
      <div class="br" />
      检测到你有
      <span style="color: red">{{waBao.length}}</span>
      张藏宝图
      &nbsp;
      <Button
        @click="handleAutoWaBao"
        size="small"
        type="info"
      >
        自动挖宝
      </Button>
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
      <Dropdown trigger="click" v-else>
        <Button
          size="small"
          type="info"
        >
          {{ user.map.name }}
        </Button>
        <DropdownMenu slot="list">
          <DropdownItem
             v-for="item in toMap"
            :key="item.id"
            @click.native="() => {
              $Message.warning(`正在切图去${item.name}，别乱点`)
              moveToMap(item.id).then(() => {
                $Message.success(`${item.name}到了`)
              });
            }"
          >{{item.name}}</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </template>
    <!-- 地图 ↑ -->
    <!-- 副本 ↓ -->
    <template v-if="user.team && user.team.leader === user.email">
      副本：
      <Dropdown trigger="click">
        <Button
          size="small"
          type="info"
        >
          {{ user.combatName || '未选择' }}
        </Button>
        <DropdownMenu slot="list">
          <DropdownItem
             v-for="item in user.screens"
            :key="item._id"
            @click.native="() => {
              user.team.combat = item._id;
              game.switchCombatScreen(item._id);
            }"
          >{{item.name}}</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </template>
    <!-- 副本 ↑ -->
    <!-- 组队 ↓ -->
    队伍：
    <template v-if="user.team && user.team.leader === user.email">
      [{{ user.team.users.length || 1 }}/{{user.combatTotal || '未知'}}]
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
      <Dropdown trigger="click" @click.native="game.getTeamList(user.map.id)">
        <Button
          size="small"
          type="success"
        >
          加入
        </Button>
        <DropdownMenu slot="list">
          <DropdownItem
            v-for="item in user.teams"
            :key="item._id"
            @click.native="() => {
              game.addTeam(item._id);
            }"
          >
            {{item.leader.nickname}}
            &nbsp;
            [{{item.users.length}}/{{(item.combat || {}).player_num}}]
            &nbsp;
            ({{(item.combat || {}).name}})
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </template>
    <!-- 组队 ↑ -->
    <div class="br" />
    <!-- 技能 ↓ -->
    技能：
    <Dropdown v-if="user.skills" trigger="click">
      <Button
        size="small"
        type="warning"
      >
        {{user.skillname || '物理攻击'}}
      </Button>
      <DropdownMenu slot="list">
        <DropdownItem v-if="user.skills.length === 0">
          没技能
        </DropdownItem>
        <DropdownItem
          v-for="item in user.skills"
          :key="item._id"
          @click.native="() => {
            $set(user, 'skillid', item._id);
            $set(user, 'skillname', item.name);
          }"
        >{{item.name}}</DropdownItem>
      </DropdownMenu>
    </Dropdown>
    <!-- 捕捉 ↓ -->
    捕捉：
    <Select v-model="user.catchPet" multiple size="small" style="width: auto;">
      <Option
        v-for="monster in monsterList"
        :value="monster"
        :label="monster"
        :key="monster"
      >
        {{monster}}
      </Option>
    </Select>
    &nbsp;
    丢弃：
    <Select v-model="user.discardPet" multiple size="small" style="width: auto;">
      <Option
        v-for="monster in monsterList"
        :value="monster"
        :key="monster"
      >
        {{monster}}
      </Option>
    </Select>
    <div class="br" />
    <!-- 战斗信息 ↓ -->
    <div v-if="'object' == typeof user.message">
      [{{ user.message.time }}]
      &nbsp;
      {{'第' + user.message.round_num + '轮'}}
      &nbsp;
      <div
        v-html="user.message.mark"
      />
      <div
        v-html="user.message.msg.join('<br />')"
      />
    </div>
    <!-- 战斗信息 ↑ -->
    <!-- 综合弹窗 ↓ -->
    <Modal
      v-model="showModal"
      fullscreen
      footer-hide
      :title="modalTitle"
    >
      <template v-if="'Gains' === modalType">
        <div v-if="!fightGains.beginTime">
          {{gains.tips}}
        </div>
        <template v-else>
          <CellGroup>
            <Cell
              title="开始时间"
              :extra="`${gains.beginTime}`"
            />
            <Cell
              title="战斗时长"
              :extra="`${gains.fightTime}`"
            />
            <Cell
              title="获得经验"
              :extra="`${gains.gainExp}`"
            />
            <Cell
              title="战斗回合数"
              :extra="`${gains.roundCount}`"
            />
            <Cell
              title="战斗场数"
              :extra="`${gains.fightCount}`"
            />
            <Cell
              title="经验/分钟"
              :extra="`${gains.avgExp}`"
            />
            <Cell
              title="战斗场数/分钟"
              :extra="`${gains.avgFightCount}`"
            />
            <Cell title="战利品" />
          </CellGroup>
          <Tag
            v-for="(value,key) in gains.goods"
            :key="key"
            color="pink"
          >{{key}}({{value}})</Tag>
        </template>
      </template>
      <component v-else-if="!!modalType" :is="`${modalType}Component`" :user="user" :game="game" />
    </Modal>
    <!-- 综合弹窗 ↑ -->
  </div>
</template>

<script>
let messageTime;
import GameApi from "@libs/YunDingOnlineSDK.js";
import regHooks from "@libs/regHooks.js";
import configData from "@/config.js";
import { sleep, findMapPath } from "@libs/tools";
import BagComponent from '@components/bag.vue';
import EqsComponent from '@components/eqs.vue';
import MarketComponent from '@components/market.vue';
import PetComponent from '@components/pet.vue';
import SkillsComponent from '@components/skills.vue';
import TasksComponent from '@components/tasks.vue';
import UserinfoComponent from '@components/userinfo.vue';
export default {
  name: "User",
  components: { BagComponent, EqsComponent, MarketComponent, PetComponent, SkillsComponent, TasksComponent, UserinfoComponent },
  data() {
    return {
      game: {},
      user: null,
      config: configData,
      showModal: false,
      modalTitle: '',
      modalType: '',
      fightGains: {
        goods: {}, //战利品
        gainExp: 0, //获得经验
        beginTime: 0, //开始时间
        roundCount: 0, //回合数
        fightCount: 0, //战斗场数
      },
      monsterList: JSON.parse(localStorage.getItem('monsterList') || '[]'), // 怪物列表
    };
  },
  watch: {
    user: {
      deep: true,
      handler(user) {
        let combatName = null;
        let combatTotal = 0;
        if (user && user.screens && user.team) {
          if (user.team.combat) {
            const combat = user.screens.find(
              (scr) => scr._id === user.team.combat
            );
            if (combat) { 
              combatName = combat.name;
              combatTotal = combat.player_num;
            }
          }
        }
        user.combatName = combatName;
        user.combatTotal = combatTotal;
        this.saveStorageUserInfo(user);
      },
    },
    monsterList: {
      deep: true,
      handler (list) {
        localStorage.setItem('monsterList', JSON.stringify(list))
      }
    }
  },
  computed: {
    toMap() {
      const user = this.user;
      const maps = configData.maps;
      if (user && user.map) {
        return maps.filter((mp) => mp.id !== user.map.id);
      } else {
        return [];
      }
    },
    waBao() {
      const goods = this.user.goods;
      const maps = configData.maps;
      if (!goods) return [];
      const btMaps = goods
        .filter((gds) => !!gds.map)
        .map((gds) => ({
          id: gds.map,
          btId: gds.id,
          name: maps.find((mp) => mp.id === gds.map).name,
          mapid: gds.map
        }))
        .sort((a, b) => a.mapid - b.mapid);
      return btMaps;
    },
    unusecbt() {
      const goods = this.user.goods;
      if (!goods) return null;
      const unuse = goods.filter((gds) => gds.unusecbt);
      if (unuse.length === 0) return null;
      const unusecbt = {
        normal: unuse.find((usc) => !usc.highcbt),
        high: unuse.find((usc) => usc.highcbt)
      };
      return unusecbt;
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
      const avgFightCount = ((this.fightGains.fightCount / time) * 60).toFixed(1);
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
        tips: "暂无收益，请开启战斗",
      };
    }
  },
  mounted() {
    regHooks(this);
    const { email } = this.$route.params;
    let user = this.getStorageAccount(email);
    this.initUser(email, user.password);

    // 每隔1分钟检测有没有战斗信息更新
    setInterval(() => {
      const now = Date.now();
      if (now - messageTime > 30000) {
        setTimeout(() => {
          window.location.reload();
        }, ~~(Math.random()*60*1000)+30000);
      }
    }, 60000);
  },
  methods: {
    /**
     * 从 localStorage 中取出账号密码
     * @param {*} email
     */
    getStorageAccount: function (email) {
      let users =
        JSON.parse(localStorage.getItem("ydxxGame_userList") || "{}") || {};
      return { email: email, password: users[email] };
    },
    /**
     * 将技能保存到 localStorage 中
     * @param {*} 用户的所有信息
     */
    saveStorageUserInfo: function (user) {
      localStorage.setItem(
        user.email,
        JSON.stringify({
          fighting: user.fighting,
          email: user.email,
          skillid: user.skillid,
          skillname: user.skillname,
          catchPet: user.catchPet,
          discardPet: user.discardPet || []
        })
      );
    },
    /**
     * 从 localStorage 中取出用户技能
     */
    getStorageUserInfo: function (email) {
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
    initUser: function (email, password) {
      // 创建游戏对象
      const game = new GameApi();
      // 加载技能数据
      const user = this.getStorageUserInfo(email) || {
        email,
        status: "已添加",
        teams: [],
        fighting: false,
      };

      // 游戏对象保存起来
      this.game = game;
      // 暴露到全局
      window.game = game;

      // 添加到用户列表
      user.market = { type: '1' };
      this.user = user;
      // 暴露到全局
      window.user = this.user;

      // 登录账号
      game.login(email, password);
    },
    // 设置消息
    setMessage: function (email, data) {
      console.log(data)
      messageTime = Date.now();
      data.time = this.getDateTime();
      //记录战斗开始时间
      this.fightGains.beginTime = this.fightGains.beginTime || messageTime;
      //回合数+1
      this.fightGains.roundCount++;
      data.msg = data.round_arr.map(ra => {
        if (ra.a_skill_type === 1) {
          if (ra.mark.indexOf('成功') > 1) {
            this.game.getMyPet();
          }
          return ra.mark;
        }
        let trigger = '';
        if (ra.a_trigger.length > 0) {
          trigger = '触发了【';
          trigger += ra.a_trigger.join('，');
          trigger += '】';
        }
        return `【${ra.a_name}】${trigger}对【${ra.b_name}】使用了【${ra.process}】造成了【${ra.hurt
              .map(Math.floor)
              .join(",")}】伤害`
      })

      if (data.die_arr && data.die_arr.length) {
        data.msg.push(data.die_arr.map((da) => `${da}卒`).join(","));
      }

      if (data.win === 1) {
        data.exp.forEach((item) => {
          if (item.name == email) {
            data.msg.push(`获得经验【${Math.floor(item.exp) || "没经验了"}】`);
            this.fightGains.gainExp += Math.floor(item.exp);
            this.fightGains.fightCount++;
          }
        });
        data.player_reward.forEach((item) => {
          if (item.name == email) {
            if (item.mark) {
              data.msg.push(item.mark);
            } else {
              let reward = [];
              item.goods.forEach((good) => {
                reward.push(good.gname);
              });
              if (reward.length > 0) {
                data.msg.push(`战利品【${reward.join(",")}】`);
                //获取战利品后,添加更新背包的状态
                this.user.updateGoods = true;
                //合并，更新战利品
                reward.forEach((ele) => {
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
        data.msg.push("你死了");
        this.fightGains.fightCount++;
      }

      this.$set(this.user, "message", data);
    },
    // 加点
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
    getDateTime() {
      let date = new Date();
      return "H:i:s".replace(/[His]/g, (full) => {
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
    async handleAutoWaBao () {
      if (this.user.team || this.user.fighting || this.user.message) {
        this.game.leaveTeam();
        this.$Message.warning('想办法把战斗停下来，然后重新加载至没有战斗信息为止，否则会触发刷新重连');
        this.$set(this.user, 'fighting', false);
        return;
      }
      this.$Message.warning('开始全部挖藏宝图，别乱点');
      window.freshPackage = false;
      for (let i = 0; i < this.waBao.length; i++) {
        const cbt = this.waBao[i];
        this.$Message.success(`正在挖第${i+1}/${this.waBao.length}个藏宝图`);
        await this.moveToMap(cbt.mapid);
        await sleep(5000);
        this.$Message.success(`正在挥动洛阳铲`);
        this.game.wbt(cbt.btId);
      }
      this.$Modal.info({
        render: () => (
          <div>
            {this.user.wbtResult.map(msg => (
              <div>
                {msg}
              </div>
            ))}
          </div>
        )
      });
      window.freshPackage = true;
      this.game.userInfo();
      // 重置背包
      this.user.goods = [];
      this.user.goodsPage = 1;
      this.game.getMyGoods();
      this.readToUse = null;
    },
    async moveToMap (toid) {
      if (this.user.map.id === toid) {
        return
      }
      const path = findMapPath(this.user.map.id, toid);
      for(let i = 0; i < path.length; i++) {
        const map = path[i];
        this.$Message.success(`正在切图去${map.name}`);
        this.game.moveToNewMap(map.id);
        await sleep(5000);
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
<style lang="less">
.br {
  height: 5px;
  width: 100%;
}
.ivu-modal-header {
  padding: 8px 4px !important;
}
.ivu-modal-close {
  top: 0 !important;
}
.ivu-modal-footer {
  padding: 4px !important;
}
.ivu-modal-body {
  padding: 0 !important;
}

.eq-img {
  width: 20px;
  vertical-align: middle;
  margin-right: 10px;
}

.ivu-tabs-bar {
  margin-bottom: 0 !important;
  .ivu-tabs-tab {
    padding: 8px 5px !important;
  }
}

.ivu-table-tbody {
  font-size: 12px;

  .ivu-table-column-center {
    height: 36px;
    .ivu-table-cell {
      padding: 0;
    }
  }
}
</style>
