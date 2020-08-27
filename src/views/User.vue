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
          @click="showEqsInfo = true"
        >
          装备
        </Button>
        <Button
          size="small"
          type="info"
          @click="showUserInfo = true"
        >
          属性
        </Button>
        <Button
          size="small"
          type="info"
          @click="showGains = true"
        >
          收益
        </Button>
      </ButtonGroup>
    </p>

    <!-- 战斗统计 ↑ -->
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
    <!-- 修炼 -->
    <template v-if="user.arms">
      <div class="br" />
      <div>
        <Tag v-for="arm in user.arms" :key="arm.name">
          {{arm.name}}[{{arm.exp}}/{{arm.needExp}}]
        </Tag>
        &nbsp;
        <Poptip
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
            <Input v-model="upSkillNum" type="number" style="width: 180px">
              <Select transfer v-model="upSkillType" slot="prepend" style="width: 60px;">
                <Option :value="1">剑修</Option>
                <Option :value="2">枪修</Option>
              </Select>
              <Button slot="append" type="primary" size="small" @click="handleFationSkill">确定</Button>
            </Input>
          </div>
        </Poptip>
      </div>
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
          [<a @click="() => {
            readToUse = {
              useNum: unusecbt.normal.num,
              id: unusecbt.normal.id,
              name: '藏宝图'
            };
            handleUseItem()
          }">全部鉴定</a>]
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
            readToUse = {
              useNum: unusecbt.high.num,
              id: unusecbt.high.id,
              name: '高级藏宝图'
            };
            handleUseItem();
          }">全部鉴定</a>]
        </template>
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
    <Button
      size="small"
      type="info"
      @click="catchPets"
      style="margin:5px"
    >捕捉</Button>
    <span style="color:#d2d4d6;font-size:12px">(勉强能用)</span>
    <!-- 技能 ↑ -->
    <div class="br" />
    宠物：
    <Button
      size="small"
      type="info"
      @click="showMypets=true"
    >查看</Button>
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
    <!-- 背包↓ -->
    <Modal
      v-model="opened"
      fullscreen
      footer-hide
    >
      <div
        slot="header"
        class="good-header"
      >
        <span>储物戒指</span>
        <Input
          v-model="searchText"
          suffix="ios-search"
          placeholder="名称、说明、属性值"
          style="width: 66%"
        />
      </div>
      <div class="goods-box">
        <Badge
          :count="item.selected"
          overflow-count="999"
          v-for="item in goods"
          :key="item.id"
        >
          <Button
            size="small"
            class="good-name"
            :style="item.style"
            @click="goodsHandle(item)"
          >
            <label v-html="item.name"></label>({{item.num}})
          </Button>
        </Badge>

      </div>
      <div class="good-info">
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
                <span
                  :style="readToUse.style"
                  v-for="(value,key) in readToUse.eq_info"
                  :key="key"
                >
                  <span :style="key | addStyle">{{key}}:</span>
                  <span :style="key | addStyle">{{value}}</span>
                </span>
              </div>
            </template>
          </div>
          <div class="button-box">
            <InputNumber
              v-if="readToUse.goodsType !== '可装备的装备'"
              :max="readToUse.num"
              :min="1"
              v-model="readToUse.useNum"
            />
            <ButtonGroup
              size="small"
              vertical
            >
              <Button
                size="small"
                type="primary"
                @click="selectGood"
              >
                标记
              </Button>
              <Button
                v-if="['可装备的装备'].includes(readToUse.goodsType)"
                size="small"
                type="primary"
                @click="handleWearItem"
              >
                装备
              </Button>
              <Button
                v-if="['未鉴定的装备', '藏宝图', '技能书', '蛋', '大补丹'].includes(readToUse.goodsType)"
                size="small"
                type="primary"
                @click="handleUseItem"
              >
                使用
              </Button>
              <Button
                size="small"
                type="primary"
                @click="() => $Message.info('还没做嘤嘤嘤')"
              >
                出售
              </Button>
              <Button
                v-if='selectedGoods.length > 1'
                size="small"
                type="primary"
                @click="makeGoods"
              >
                合成
              </Button>
              <Button
                size="small"
                type="primary"
                @click="handleSellItem"
              >
                分解
              </Button>
            </ButtonGroup>

          </div>
        </template>
      </div>
    </Modal>
    <!-- 背包↑ -->
    <!-- 收益↓ -->
    <Modal
      v-model="showGains"
      fullscreen
      footer-hide
      title="战斗收益"
    >
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
    </Modal>
    <!-- 收益↑ -->
    <!-- 人物装备↓ -->
    <Modal
      v-model="showEqsInfo"
      fullscreen
      footer-hide
      title="装备信息"
    >
      <Collapse simple>
        <Panel
          :name="index | getIndex"
          v-for="(item,index) in eqsInfo"
          :key="item.id"
        > <img
            :src="item.img"
            class="eq-img"
          >
          <span :style="item.style">{{item.name}}</span>
          <div slot="content">
            <div
              :style="`padding:2px;${item.style}`"
              v-for="(value,key) in item.info"
              :key="key"
            >
              <span :style="key | addStyle">{{key}}：</span>
              <span :style="key | addStyle">{{value}}</span>
            </div>
          </div>

        </Panel>
      </Collapse>
    </Modal>
    <!-- 人物装备↑ -->
    <!-- 人物属性↓ -->
    <Modal
      v-model="showUserInfo"
      fullscreen
      footer-hide
      title="人物属性"
    >
      <CellGroup>
        <Cell
          v-for="(value, key) in userInfo"
          :key="key"
          :title="key"
          :extra="`${value}`"
        />
      </CellGroup>
    </Modal>
    <!-- 人物属性↑ -->
    <!-- 宠物信息↓ -->
    <Modal
      v-model="showMypets"
      fullscreen
      footer-hide
      title="宠物信息"
    >
      <Tabs
        v-model="tabPaneName"
        size="small"
      >
        <TabPane
          :label="item.name"
          :name="`name${index+1}`"
          v-for="(item, index) in petsInfo"
          :key="item.id"
        >
          <Divider size="small">状态：{{item.status?'已参战':'休息中'}}</Divider>
          <p
            style="padding:5px"
            v-if="item.skills.length === 0"
          >
            无技能
          </p>
          <Poptip
            v-else
            word-wrap
            transfer
            width="200"
            trigger="hover"
            v-for="(skill,index) in item.skills"
            :key="index"
            :content="skill.info"
          >
            <Button
              :style="skill.style"
              size="small"
            >{{skill.name}}</Button>
          </Poptip>

          <Table
            v-if="tabPaneName === `name${index+1}`"
            :show-header="false"
            :columns="columns"
            :data="item.data"
            border
          ></Table>
          <ButtonGroup
            size="small"
            shape="circle"
            class="pet-btn"
          >
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,3)"
            >放生</Button>
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,4)"
            >幻化</Button>
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,1)"
            >升级</Button>
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,2,1)"
            >全力</Button>
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,2,2)"
            >全魔</Button>
            <Button
              size="small"
              type="primary"
              @click="handlePet(item,5)"
            >{{item.status?"休息":"参战"}}</Button>
          </ButtonGroup>
          <ButtonGroup
            size="small"
            shape="circle"
            class="pet-btn"
          >
            <Button
              size="small"
              type="success"
              @click="handlePet(item, 6)"
            >合宠</Button>
            <Button
              size="small"
              type="success"
              @click="handlePet(item, 7)"
            >打书</Button>
          </ButtonGroup>
        </TabPane>
      </Tabs>
    </Modal>
    <!-- 宠物信息↑ -->
    <!-- 防误操作modal -->
    <Modal
      v-model="modal"
      :styles="{top: '85px'}"
    >
      <p
        slot="header"
        style="color:#f60;text-align:center"
      >
        <Icon type="ios-information-circle"></Icon>
        <span>确定{{handleData.name}}？</span>
      </p>
      <div style="text-align:center">
        <img
          v-if="handleData.type<6"
          src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1593343846064&di=97a86fe902b9754de368f02e336e4eab&imgtype=0&src=http%3A%2F%2Fwww.11xzb.com%2Fd%2Ffile%2Fmoban5%2F201909020832%2F1567158444899421.png"
          alt=""
          style="width:120px;padding-top:5px"
        >
        <!-- 合宠 -->
        <div
          v-else-if="handleData.type===6"
          class="slelect-box"
        >
          <Select
            v-model="pet1"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet2] | disabled"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
          <p>技能：{{selectPet1}}</p>
          <Select
            v-model="pet2"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet1] | disabled"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
          <p>技能：{{selectPet2}}</p>
        </div>
        <!-- 打书 -->
        <div
          v-else
          class="slelect-box"
        >
          <Select
            v-model="pet1"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet2] | disabled"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
          <p>技能：{{selectPet1}}</p>
          <Select
            v-model="pet2"
            size="small"
          >
            <Option
              v-for="item in bookList"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
        </div>

        <p v-if='handleData.type === 1'>点击确认继续升级，或者点击取消关闭面板</p>
        <p v-if='handleData.type === 3 && handleData.data.status===1'>宠物正在参战...</p>

      </div>

      <div
        slot="footer"
        style="text-align:center"
      >
        <Button
          size="small"
          @click="modal=false"
        >取消</Button>
        <Button
          type="primary"
          size="small"
          :disabled="handleData.type === 3 && handleData.data.status===1"
          @click="confirmHandle"
        >确认</Button>
      </div>
    </Modal>

  </div>

</template>

<script>
let messageTime;
import GameApi from "@libs/YunDingOnlineSDK.js";
import regHooks from "@libs/regHooks.js";
import configData from "@/config.js";
import { sleep, findMapPath } from "@libs/tools";
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
      showEqsInfo: false,
      showUserInfo: false,
      showMypets: false,
      fightGains: {
        goods: {}, //战利品
        gainExp: 0, //获得经验
        beginTime: 0, //开始时间
        roundCount: 0, //回合数
        fightCount: 0, //战斗场数
      },
      upSkillNum: 50,
      upSkillType: 1,
      readToUse: null,
      searchText: "",
      selectedGoods: [],
      tabPaneName: "name1",
      columns: [
        {
          title: "column1",
          key: "column1",
          align: "center",
        },
        {
          title: "column2",
          key: "column2",
          width: 85,
          align: "center",
        },
        {
          title: "column3",
          key: "column3",
          width: 65,
          align: "center",
        },
      ],
      modal: false,
      handleData: {},
      pet1: "",
      pet2: "",
      target: "粉红海兔",
      msgList: []
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
              (scr) => scr._id === user.team.combat
            );
            if (combat) combatName = combat.name;
          }
        }
        user.combatName = combatName;
        this.saveStorageUserInfo(user);
      },
    },
  },
  filters: {
    addStyle(val) {
      const arr1 = ["体质", "魔力", "力量", "耐力", "敏捷"];
      const arr2 = ["物理暴击", "法术暴击", "特技"];

      if (arr1.includes(val)) {
        return "color:green;font-weight: 600;";
      }
      if (arr2.includes(val)) {
        return "color:orchid;";
      }
      return "";
    },
    getIndex(val) {
      const index = val + 1;
      return index.toString();
    },
    //参战宠物和重复不能选
    disabled(val) {
      return val[0] ? true : false || val[1] === val[2];
    },
  },
  computed: {
    toMap() {
      const user = this.user;
      const maps = configData.maps;
      if (user && user.map) {
        const { up, next } = maps.find((mp) => mp.id === user.map.id);
        const toMaps = [...up, ...next].map((id) => {
          const name = maps.find((mp) => mp.id === id).name;
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
    hightcbtTask() {
      const userTasks = this.user.userTasks;
      if (!userTasks) return null;
      return this.user.userTasks.find(
        (ust) => ust.task._id === this.hightcbtTaskId
      );
    },
    //背包
    goods() {
      let arr = [];
      if (this.user.goods) {
        this.user.goods.forEach((ele) => {
          const { name, num, id } = ele;
          const price_type = [null, "灵石", "仙石"];
          const price = ele.info.price_type
            ? `${ele.info.price / ele.info.price_type}${
                price_type[ele.info.price_type]
              }`
            : null; //价格
          const info = ele.info.info; //描述
          const style = ele.info.style; //文字样式
          const goodsType = ele.goodsType; //文字样式
          const selected = this.selectedGoods.find(
            (item) => item.id === ele.id
          );

          let obj = {
            name,
            num,
            id,
            price,
            info,
            style,
            goodsType,
            selected: selected ? selected.num : 0,
          };
          if (ele.goodsType === "可装备的装备") {
            const eq_info = this.getEqsInfo(ele.info);
            obj.eq_info = eq_info;
          }
          arr.push(obj);
        });
      }

      if (this.searchText) {
        const list = arr.filter((ele) => {
          let str = `${ele.name}${ele.info}`;
          if (ele.eq_info) {
            str += JSON.stringify(ele.eq_info);
          }
          return str.includes(this.searchText);
        });
        return list;
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

        tips: "暂无收益，请开启战斗",
      };
    },
    eqsInfo() {
      let arr = [];
      this.user.userEqs &&
        this.user.userEqs.forEach((ele) => {
          const obj = this.getEqsInfo(ele);
          const { name, style, img } = ele;
          arr.push({
            name,
            style,
            img,
            info: obj,
          });
        });
      return arr;
    },
    userInfo() {
      const obj = this.user.myInfo;
      let info = {};
      if (obj) {
        info = {
          等级: obj.level,
          经验: Math.round(obj.exp),
          气血: obj.hp_cap,
          魔法: obj.mp,
          命中: obj.hit,
          物理伤害: obj.physical_damage,
          物理防御: obj.physical_defense,
          魔法伤害: obj.magic_damage,
          魔法防御: obj.magic_defense,
          治疗能力: obj.restore_damage,
          速度: obj.speed,
          物理暴击: obj.physical_crit,
          法术暴击: obj.magic_crit,
          体质: obj.con,
          魔力: obj.int,
          力量: obj.str,
          耐力: obj.vit,
          敏捷: obj.agi,
          潜力: obj.potential_num,
          躲避: obj.dodge,
          活力: Math.round(obj.vitality_num),
          气血储备: Math.round(obj.hp_store),
          魔法储备: Math.round(obj.mp_store),
          宝宝经验: Math.round(obj.pet_exp),
        };
      }

      return info;
    },
    petsInfo() {
      const arr = this.user.myPets;
      let pets = [];
      const type = ["普通", "稀有", "传说", "PY"];
      arr &&
        arr.forEach((ele) => {
          const { skill, _id, name, status } = ele;
          const data = [
            {
              column1: `等级：${ele.level}`,
              column2: `类型：${type[ele.type]}`,
              column3: `成长：${ele.growing_num.toFixed(2)}`,
            },
            {
              column1: `气血：${Math.round(ele.hp)}`,
              column2: `魔法：${Math.round(ele.mp)}`,
              column3: `命中：${Math.round(ele.hit)}`,
            },
            {
              column1: `攻击资质：${ele.str_zz}`,
              column2: `物理伤害：${Math.round(ele.physical_damage)}`,
              column3: `力量：${ele.str}`,
            },
            {
              column1: `法力资质：${ele.int_zz}`,
              column2: `魔法伤害：${Math.round(ele.magic_damage)}`,
              column3: `魔力：${ele.int}`,
            },
            {
              column1: `体力资质：${ele.con_zz}`,
              column2: `魔法防御：${Math.round(ele.magic_defense)}`,
              column3: `体质：${ele.con}`,
            },
            {
              column1: `防御资质：${ele.vit_zz}`,
              column2: `物理防御：${Math.round(ele.physical_defense)}`,
              column3: `耐力：${ele.vit}`,
            },

            {
              column1: `速资质度：${ele.speed_zz}`,
              column2: `速度：${Math.round(ele.speed)}`,
              column3: `敏捷：${ele.agi}`,
            },
            {
              column1: `躲避质度：${ele.dodge_zz}`,
              column2: `躲避：${Math.round(ele.dodge)}`,
              column3: `潜力：${ele.potential_num}`,
            },
          ];
          let skills = [];
          skill.forEach((item) => {
            skills.push({
              name: item.name,
              info: item.info,
              style: item.high ? "margin:5px;color:orchid" : "margin:5px;",
            });
          });
          const point = ele.potential_num;
          const obj = { _id, skills, name, data, status, point };
          pets.push(obj);
        });
      return pets;
    },
    petList() {
      const options = [];
      this.petsInfo.forEach((ele) => {
        let skills = [];
        ele.skills.forEach((item) => {
          skills.push(item.name);
        });
        options.push({
          value: ele._id,
          label: `${ele.name} ， ${ele.data[0].column3}`,
          skills,
          status: ele.status,
        });
      });
      return options;
    },
    selectPet1() {
      const pet = this.petList.find((ele) => this.pet1 === ele.value) || {
        skills: [],
      };
      return pet.skills.join("，") || "无";
    },
    selectPet2() {
      const pet = this.petList.find((ele) => this.pet2 === ele.value) || {
        skills: [],
      };
      return pet.skills.join(",") || "无";
    },
    bookList() {
      const options = [];
      this.goods.forEach((ele) => {
        ele.goodsType === "兽决" &&
          options.push({
            value: ele.id,
            label: ele.name,
          });
      });
      return options;
    },
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
        window.location.reload();
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
      this.user = user;
      // 暴露到全局
      window.user = user;

      // 登录账号
      game.login(email, password);
    },
    // 设置消息
    setMessage: function (email, data) {
      messageTime = Date.now();
      data.time = this.getDateTime();
      //记录战斗开始时间
      this.fightGains.beginTime = this.fightGains.beginTime || messageTime;
      //回合数+1
      this.fightGains.roundCount++;
      const msg = data.round_arr.find((dr) => dr.a_name === email);
      data.msg = [
        msg
          ? `${email}使用了[${msg.process}]造成了[${msg.hurt
              .map(Math.floor)
              .join(",")}]伤害`
          : "",
      ];

      if (data.die_arr && data.die_arr.length) {
        data.msg.push(data.die_arr.map((da) => `${da}卒`).join(","));
      }

      if (data.win === 1) {
        data.exp.forEach((item) => {
          if (item.name == email) {
            data.msg.push(`获得经验[${item.exp || "没经验了"}]`);
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
                data.msg.push(`战利品[${reward.join(",")}]`);
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
      if (this.upSkillNum <= 0) {
        this.$Message.error('大胸弟，别搞事情');
        return;
      }
      if (this.upSkillNum * 20000 > this.user.myInfo.game_silver) {
        this.$Message.error('大胸弟，你钱不够啊');
        return;
      }
      this.$Spin.show({
        render: () => (
          <p>
            正在自动连点技能，为避免请求次数过多和程序错乱，在此窗口关闭后再进行其他操作
          </p>
        ),
      });
      for (let i = 0; i < this.upSkillNum; i++) {
        this.game.repairUserArms(this.upSkillType);
        await sleep(100);
      }
      this.game.userInfo();
      this.game.getMySkill();
      this.$Spin.hide();
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
    // 打开背包
    openBag() {
      this.opened = !this.opened;
      this.readToUse = null;
      this.searchText = "";
      this.selectedGoods = [];
      //更新背包状态为 true 且 opened 为true时 ，重置背包
      if (this.user.updateGoods && this.opened) {
        this.user.updateGoods = false;
        this.user.goods = [];
        this.user.goodsPage = 1;
        this.game.getMyGoods();
      }
    },
    // 使用物品
    async handleUseItem() {
      const { useNum, id, name } = this.readToUse;
      window.freshPackage = false;
      this.$Spin.show({
        render: () => (
          <p>
            正在连续使用物品{name}
            {useNum}
            个，为避免请求次数过多和程序错乱，在此窗口关闭后再进行其他操作
          </p>
        ),
      });
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
      //重置宠物信息
      name.includes("蛋") && this.game.getMyPet();
      this.readToUse = null;
      this.$Spin.hide();
    },
    // 装备物品
    handleWearItem() {
      const { id } = this.readToUse;
      this.game.wearUserEquipment(id);
    },
    // 分解物品
    handleSellItem() {
      const { useNum, id, name } = this.readToUse;
      this.game.sellGoods([{ id, num: useNum }]);
      this.readToUse = null;
    },
    //选择物品
    selectGood() {
      const { useNum, id } = this.readToUse;
      const obj = this.selectedGoods.find((ele) => {
        const res = ele.id === id;
        if (res) {
          ele.num = useNum;
        }
        return res;
      });
      if (!obj) {
        this.selectedGoods.push({ id, num: useNum });
      }
    },
    //合成物品
    makeGoods() {
      this.game.makeGoods(this.selectedGoods);
      this.selectedGoods = [];
    },
    //物品操作
    goodsHandle(val) {
      this.readToUse = val;
      this.readToUse.useNum = 1;
    },
    //用于生成装备展示信息
    getEqsInfo(obj) {
      const eq_data = {
        佩戴等级: obj.wear_level,
        物理伤害: obj.physical_damage,
        物理防御: obj.physical_defense,
        魔法伤害: obj.magic_damage,
        魔法防御: obj.magic_defense,
        治疗能力: obj.restore_damage,
        气血: obj.a,
        速度: obj.speed,
        体质: obj.con,
        魔力: obj.int,
        力量: obj.str,
        耐力: obj.vit,
        敏捷: obj.agi,
        物理暴击: obj.physical_crit,
        法术暴击: obj.magic_crit,
        特技: obj.skill ? `${obj.skill.name}--${obj.skill.info}` : "",
        评分: Math.round(obj.score),
      };
      let eq_info = {};
      for (const key in eq_data) {
        if (eq_data.hasOwnProperty(key)) {
          const element = eq_data[key];
          if (element) {
            eq_info[key] = element;
          }
        }
      }
      return eq_info;
    },
    //宠物相关操作
    handlePet(obj, type, point) {
      const arr = ["升级", "加点", "放生", "幻化", "参战/休息", "合成", "打书"];
      const points = {
        str: point === 1 ? obj.point : 0, // 力量
        int: point === 2 ? obj.point : 0, // 智力
        agi: 0, // 敏捷
        vit: 0, // 耐力
        con: 0, // 体质
      };

      this.modal = true;
      this.handleData = {
        type: type,
        data: obj,
        point: type === 2 ? points : null,
        name: arr[type - 1],
      };
    },
    confirmHandle() {
      const data = this.handleData;

      //升级，放生，加点
      if (data.type < 4) {
        this.game.upUserPetLevel(data.data._id, data.type, data.point);
      }
      //幻化
      if (data.type === 4) {
        this.game.turnIntoPet(data.data._id);
        this.tabPaneName = "name1";
      }
      //参战 or 休息
      if (data.type === 5) {
        const status = data.data.status ? 0 : 1;
        this.game.playUserPet(data.data._id, status);
        this.tabPaneName = "name1";
      }
      //合宠
      if (data.type === 6) {
        this.game.fitPet(this.pet1, this.pet2);
        this.tabPaneName = `name${this.petsInfo.length - 1}`;
        this.pet1 = "";
        this.pet2 = "";

      }
      if (data.type === 7) {
        this.game.addUserPetSkill(this.pet2, this.pet1);
        this.pet1 = "";
        this.pet2 = "";

      }

      if (data.type !== 1) {
        this.modal = false;
      }
    },
    //抓宝宝
    catchPets(val) {
      this.$set(this.user, 'skilltype', '1001');
      this.$set(this.user, 'skillid', '');
      this.$set(this.user, 'skillname', '捕捉');
      this.$set(this.user, 'target', this.target);
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
        await sleep(5000);
        this.$Message.success(`正在切图去${map.name}`);
        this.game.moveToNewMap(map.id);
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

.good-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 32px;
  .ivu-input-with-suffix {
    font-size: 12px;
  }
}
.good-info {
  box-shadow: 0 3px 10px;
  font-size: 12px;
  background: #fff;
  opacity: 0.9;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 10px;
  position: fixed;
  z-index: 99;
  bottom: 0;
}
.goods-box {
  padding-bottom: 180px;
  .ivu-badge {
    width: 48%;
    margin: 0 1%;
    .good-name {
      margin: 0 0.3% 5px 0;
      width: 100%;
      font-size: 12px !important;
    }
    .ivu-badge-count {
      font-size: 8px;
      top: 2px;
      right: 10px;
    }
  }
}

.info-box {
  padding-right: 20px;
  .basci-info,
  .eq-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
}
.button-box {
  display: flex;
  flex-direction: column;
  .ivu-btn {
    margin-top: 2px !important;
  }
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
.pet-btn {
  padding-top: 5px;
  display: flex !important;
  justify-content: center;
  .ivu-btn {
    padding: 0 6px !important;
  }
}

.slelect-box {
  padding: 10px;
  p {
    padding: 10px;
  }
}
</style>
