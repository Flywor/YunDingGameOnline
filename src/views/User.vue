<template>
  <div
    v-if="user"
    class="user"
  >
    <p>
      状态：{{user.status}}&nbsp;{{ user.status_msg && `${user.status_msg}` }}
      <Button
        size="small"
        type="info"
        @click="showGains = true"
      >
        查看收益
      </Button>
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
          储物戒指
        </Button>

      </p>
      <div class="br" />
      <p>
        气血储备：{{ Math.floor(user.myInfo.hp_store) }}&nbsp;魔法储备：{{ Math.floor(user.myInfo.mp_store) }}
      </p>
    </template>
    <!-- 挖宝 ↓ -->
    <template>
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
          <div class="br" />
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
    <Modal v-model="opened" fullscreen footer-hide>
      <div slot="header" class="good-header">
            <span>储物戒指</span>
             <Input v-model.lazy="searchText" suffix="ios-search" placeholder="名称、说明、属性值" style="width: 66%" />
      </div>
      <div class="goods-box">
        <Button v-for="item in goods" :key="item.id" size="small" class="good-name" :style="item.style" @click="goodsHandle(item)">
        {{item.name}}({{item.num}})
      </Button>
      </div>
      <div class="good-info" >
        <p v-if="!readToUse">
          去上面点一个物品
        </p>
        <template v-else>
          <div class="info-box">
            <div class="basci-info">
              <span :style="readToUse.style">
              {{readToUse.name}}
              </span>
              <span :style="readToUse.style">价格：{{readToUse.price}}</span>
              <span :style="readToUse.style">{{readToUse.info}}</span>
            </div>
            <template v-if="readToUse.eq_info">
              <div class="eq-info">
                <span :style="readToUse.style" v-for="(value,key) in eq_info" :key="key">
                <span>{{key}}:</span>
                <span>{{value}}</span>
                </span>
              </div>
              </template>
          </div>
          <div class="button-box">
            <InputNumber v-if="readToUse.goodsType !== '可装备的装备'" :max="readToUse.num" :min="1" v-model="readToUse.useNum"/>
            <ButtonGroup size="small" vertical>
            <Button v-if="['可装备的装备'].includes(readToUse.goodsType)" size="small" type="primary" @click="handleWearItem">
              装备
            </Button>
            <Button v-if="['未鉴定的装备', '藏宝图', '技能书', '蛋', '大补丹'].includes(readToUse.goodsType)" size="small" type="primary" @click="handleUseItem">
              使用
            </Button>
            <Button size="small" type="primary" @click="() => $Message.info('还没做嘤嘤嘤')">
              出售
            </Button>
            <Button size="small" type="primary" @click="handleSellItem">
              分解
            </Button>
          </ButtonGroup>
          
          </div>
        </template>
      </div>
    </Modal>
    <Modal v-model="showGains" fullscreen footer-hide title="战斗收益">
      <div v-if="!fightGains.beginTime">
        {{gains.tips}}
      </div>
      <template v-else>
        <CellGroup>
          <Cell title="开始时间" :extra="`${gains.beginTime}`" />
          <Cell title="战斗时长" :extra="`${gains.fightTime}`" />
          <Cell title="获得经验" :extra="`${gains.gainExp}`" />
          <Cell title="战斗回合数" :extra="`${gains.roundCount}`" />
          <Cell title="战斗场数" :extra="`${gains.fightCount}`" />
          <Cell title="经验/分钟" :extra="`${gains.avgExp}`" />
          <Cell title="战斗场数/分钟" :extra="`${gains.avgFightCount}`" />
          <Cell title="战利品" />
        </CellGroup>
        <Tag v-for="(value,key) in gains.goods" :key="key" color="pink">{{key}}({{value}})</Tag>
      </template>
    </Modal>
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
      showGains: false,
      fightGains: {
        goods: {}, //战利品
        gainExp: 0, //获得经验
        beginTime: 0, //开始时间
        roundCount: 0, //回合数
        fightCount: 0 //战斗场数
      },
      readToUse: null,
      searchText: ""
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
      
      let arr = [];
      if (this.user.goods) {
        
        this.user.goods.forEach(ele=>{
         
        const { name, num, id } = ele;
        const price_type = [null, '灵石', '仙石'];
        const price = ele.info.price_type ? `${ele.info.price/ele.info.price_type}${price_type[ele.info.price_type]}` : null;  //价格
        const info = ele.info.info; //描述
        const style =ele.info.style; //文字样式
        const goodsType =ele.goodsType; //文字样式
        let obj = {
          name, num, id, price, info, style, goodsType
        }
        if (ele.goodsType === '可装备的装备') {
          const eq_info = {
            '佩戴等级' : ele.info.wear_level,
            '物理伤害' : ele.info.physical_damage,
            '物理防御' : ele.info.physical_defense,
            '魔法伤害' : ele.info.magic_damage,
            '魔法防御' : ele.info.magic_defense,
            '治疗能力' : ele.info.restore_damage,
            '气血' : ele.info.a,
            '速度' : ele.info.speed,
            '体质' : ele.info.con,
            '魔力' : ele.info.int,
            '力量' : ele.info.vit,
            '耐力' : ele.info.str,
            '敏捷' : ele.info.agi,
            '物理暴击' : ele.info.physical_crit,
            '法术暴击' : ele.info.magic_crit,
            '特技' : ele.info.skill,
            '评分' : ele.info.score
          }
          obj.eq_info = eq_info
           
        }
        arr.push(obj)
      })
      }
      
      if (this.searchText) {
        const list = arr.filter(ele=> {
          let str = `${ele.name}${ele.info}`
          if (ele.eq_info) {
            str += JSON.stringify(ele.eq_info)
          }
          return str.includes(this.searchText)
        }) 
        return  list
      }

      return arr;
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
    },
    eq_info(){
      let obj = {};
      if (this.readToUse.eq_info) {
        const object = this.readToUse.eq_info
        for (const key in object) {
          if (object.hasOwnProperty(key)) {
          const element = object[key];
            if(element){
              obj[key] = element
            }
          }
      }
      }
      
      return obj
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
    // 打开背包
    openBag() {
      this.opened = !this.opened;
      this.readToUse = null;
      this.searchText = "";
      //更新背包状态为 true 且 opened 为true时 ，重置背包
      if (this.user.updateGoods && this.opened) {
        this.user.updateGoods = false;
        this.user.goods = [];
        this.user.goodsPage = 1;
        this.game.getMyGoods();
      }
    },
    // 使用物品
    async handleUseItem () {
     
      const { useNum, id, name } = this.readToUse;
      window.freshPackage = false
      this.$Spin.show({ render: () => (<p>正在连续使用物品{name}{useNum}个，为避免请求次数过多和程序错乱，在此窗口关闭后再进行其他操作</p>) });
      for (let i = 0; i < useNum; i++) {
        this.game.useGoods(id);
        await sleep(1100);
      }
      window.freshPackage = true;
      this.game.userInfo();
      // 重置背包
      this.user.goods = [];
      this.user.goodsPage = 1;
      this.game.getMyGoods();
      this.readToUse = null;
      this.$Spin.hide();
    },
    // 装备物品
    handleWearItem () {
      const { id } = this.readToUse;
      this.game.wearUserEquipment(id);
    },
     // 分解物品
    handleSellItem () {
      const { useNum, id, name } = this.readToUse;
      this.game.sellGoods([{ id, num: useNum }]);
      this.readToUse = null;
    },

    goodsHandle(item){
        this.readToUse = item;
        this.readToUse.useNum = 1;

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
.ivu-modal-header {
  padding: 8px 4px!important;
}
.ivu-modal-close {
  top: 0!important;
}
.ivu-modal-footer {
  padding: 4px!important;
}
.ivu-modal-body {
  padding: 0!important;
}


.good-header{
  display: flex;
  justify-content:space-between;
  align-items: center;
  padding-right: 32px;
  .ivu-input-with-suffix{
    font-size: 12px;
  }
}
.good-info{
  box-shadow: 0 3px 10px;  
  font-size:12px;
  background: #fff;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 10px;
  position: fixed;
  bottom: 0;
}
.goods-box{
   padding-bottom: 180px;
  .good-name{
  margin: 0 0.3% 5px 0;
  width:49%;
  font-size:12px!important;
 
}
}



.info-box{
  padding-right: 20px;
  .basci-info, .eq-info{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }


}
.button-box{
  display: flex;
  flex-direction: column;
  .ivu-btn{
    margin-top: 2px!important;
  }
}

</style>
