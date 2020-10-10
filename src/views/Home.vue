<template>
  <div class="home">
    <Form
      ref="formInline"
      :model="formInline"
      inline
    >
      <FormItem prop="user" class="formitem">
        <Input type="text" v-model="formInline.user" placeholder="账号" />
      </FormItem>
      <FormItem prop="password" class="formitem">
        <Input type="password" v-model="formInline.password" placeholder="密码"/>
      </FormItem>
      <FormItem>
        <Button type="primary" size="small" @click="handleLogin">添加账号</Button>
      </FormItem>
      <FormItem>
        <Button type="primary" size="small" @click="showSkillMap = true">技能图鉴</Button>
      </FormItem>
      <FormItem>
        <Button type="primary" size="small" @click="showMonsterMap = true">怪物图鉴</Button>
      </FormItem>
      <FormItem>
        <Button type="primary" size="small" @click="showScreensContent = true">副本资料</Button>
      </FormItem>
      <FormItem>
        弹幕
        <i-switch v-model="openDm">
          <span slot="open">开</span>
          <span slot="close">关</span>
        </i-switch>
      </FormItem>
      <FormItem>
        <Input v-if="openDm" search enter-button="发送" placeholder="快来发送弹幕吧" @on-search="handleSendChat" v-model="sendMsg"/>
      </FormItem>
      <br />
      <!-- <FormItem label="每日计划：" style="width:100%">
        <CheckboxGroup v-model="dayPlan">
          <Checkbox
            v-for="option in dayPlanOptions"
            :key="option.label"
            border
            :label="option.value"
          >
            {{option.label}}
            <span v-if="option.isDone.length">
              {{option.isDone.join(',')}}√
            </span>
          </Checkbox>
        </CheckboxGroup>
      </FormItem> -->
    </Form>
    <div class="card-container">
      <Row :gutter="8">
          <Col
            :xs="24"
            :md="12"
            :xl="8"
            :xxl="8"
            v-for="(user, index) in userList"
            :key="user.email"
          >
            <Card :title="user.email" class="card">
              <div slot="extra">
                <a v-if="user.isLogin" @click="handleReload(index)">重新加载</a>
                &nbsp;
                <a v-if="user.isLogin" @click="user.isLogin = false">登出</a>
                &nbsp;
                <a v-if="!user.isLogin" @click="user.isLogin = true">登入</a>
                &nbsp;
                <a @click="deleteUser(user.email)">删除</a>
              </div>
              <iframe
                v-if="user.isLogin"
                ref="userFrame"
                :src="`${baseUrl}#/user/${user.email}`"
                @load="e => frameLoad(index)"
              />
            </Card>
          </Col>
      </Row>
    </div>
    <div>
      <Tag
        v-for="msg in msgDm"
        :key="msg.key"
        class="dm"
        :style="{ top: `${msg.top * 32}px`, display: openDm? 'block': 'none' }"
        :color="msg.color"
        size="large"
      >
        {{msg.nickname || '系统'}}：<label v-html="msg.msg" />
      </Tag>
    </div>
    <Drawer
      v-model="showSkillMap"
      :mask="false"
      width="300px"
      title="技能图鉴"
    >
      <SkillMapComponent :skillMap="skillMap" />
    </Drawer>
    <Drawer
      v-model="showScreensContent"
      :mask="false"
      width="400px"
      title="副本资料"
      placement="left"
    >
      <ScreensComponent :screens="screens" />
    </Drawer>
    <Drawer
      v-model="showMonsterMap"
      :mask="false"
      width="675px"
      title="宠物图鉴"
      draggable
    >
      <MonsterMapComponent v-if="showMonsterMap" :skillMap="skillMap" />
    </Drawer>
  </div>
</template>

<script>
const now = Date.now();
let lastServerChanSend = 0;

import ScreensComponent from '@components/screens.vue';
import MonsterMapComponent from '@components/monster-map.vue';
import SkillMapComponent from '@components/skill-map.vue';
import { sleep, randomNum } from "@libs/tools";
export default {
  name: 'Home',
  components: { ScreensComponent, MonsterMapComponent, SkillMapComponent },
  data () {
    return {
      randomNum,
      baseUrl: `${location.origin}${location.pathname}`,
      formInline: {
        user: '',
        password: ''
      },
      userList: [],
      openDm: true,
      msgList: [],
      msgDm: [],
      sendMsg: '',
      dmline: 0,
      showSkillMap: false,
      skillMap: {},
      showMonsterMap: false,
      showScreensContent: false,
      screens: [],
      dayPlan: [],
      dayPlanOptions: [
        { label: '荆棘之海', value: '5eecd6110ec93271652d2940', isDone: [] },
        { label: '每日冒险', value: '5eef5927a447f4ad9b833648', isDone: [] },
        { label: '深渊幻镜', value: '5ef9ff6669e97e5e22ccd5c5', isDone: [] },
        { label: '宝藏山', value: '5efe93c6075268219ac2e630', isDone: [] },
        { label: '鹊仙桥', value: '5f44e054e7c88d4126a9df14', isDone: [] }
      ]
    }
  },
  watch: {
    'msgList.length': {
      deep: true,
      handler (length) {
        if (length === 0) return
        const dm = this.msgList[length - 1]
        if (this.msgDm.some(md => md.msg === dm.msg)) return
        dm.top = this.randomNum(0, this.dmline)
        dm.color = this.getDmColor(dm)
        this.msgDm.push(dm)
      }
    }
  },
  mounted () {
    // 加载历史账号s
    const users = this.getStorageUser();
    const userList = []
    Object.keys(users).forEach((email) => {
      userList.push({ email, isLogin: true, password: users[email] });
    });
    this.userList = userList

    this.dmline = Math.floor(window.document.body.offsetHeight / 36) - 1
    window.addEventListener('resize', () => {
      this.dmline = Math.floor(window.document.body.offsetHeight / 36) - 1
    })

    let startTime = Date.now();
    let planCheckTimes = 0;
    const fullTeamLeader = [];
    const teammateNotInTeam = [];
    // 每隔12秒检测有没有队伍
    setInterval(() => {
      // 每24个小时执行一次
      if ((Date.now() - startTime) > 24 * 60 * 60 * 1000) { // 24 * 60 * 60 * 1000) {
        this.dayPlanOptions.map(dpo => dpo.isDone = []);
        startTime = Date.now();
      }

      const { dayPlan, dayPlanOptions } = this;
      const frames = this.$refs['userFrame'];
      frames.map(fms => {
        const { user, game } = fms.contentWindow
        if (!user || !game) return;

        if (user.team) {
          // 队长判断
          if (user.isleader) {
            // 满队且自己队友加不进的情况下就解散队伍重组
            const fullIndex = fullTeamLeader.findIndex(ftl => ftl == user.email);
            if (fullIndex > -1) {
              game.leaveTeam();
              fullTeamLeader.splice(fullIndex, 1);
              return
            }
            
            // 队员掉队找不到队伍了，队长这里却满员，刷新一下重新接收队伍信息即可解决
            const teamnotInIndex = teammateNotInTeam.findIndex(tnit => tnit == user.email);
            if (teamnotInIndex > -1) {
              teammateNotInTeam.splice(teamnotInIndex, 1);
              if (user.team.users.length === 5) {
                game.showMyTeam(1);
                fms.contentWindow.location.reload();
                return;
              }
            }

            // 没副本就切换副本
            if (!user.combatName) {
              user.team.combat = user.tempcombat;
              game.switchCombatScreen(user.tempcombat);
              user.fighting = true;
              game.startCombat(user.team.combat);
            }
            if (user.combatId) {
              if (user.team.users.length === 5) {
                game.showMyTeam(0);
              } else {
                game.showMyTeam(1);
              }
            }

            // 每日计划判断
            if (dayPlan.length) {
              const undonePlan = dayPlanOptions.find(dpo => dayPlan.includes(dpo.value) && !dpo.isDone.includes(user.email));
              if (undonePlan) {
                if (user.message && user.message.msg) {
                  const msg = user.message.msg[user.message.msg.length - 1];
                  if (msg.indexOf('达挑战上限，无奖励') > -1) {
                    if (user.team.combat == undonePlan.value) {
                      undonePlan.isDone.push(user.email);
                    } else if (planCheckTimes > 4) {
                      undonePlan.isDone.push(user.email);
                      planCheckTimes = 0;
                    }
                  }
                }
                this.$Message.info(`【${user.email}】正在执行每日计划【${undonePlan.label}】`);
                if (user.combatId) {
                  user.tempcombatid = undonePlan.value;
                  planCheckTimes++;
                } else if (user.team.combat != undonePlan.value) {
                  user.team.combat = undonePlan.value;
                  game.switchCombatScreen(undonePlan.value);
                }
              } else {
                if (user.combatId) {
                  delete user.tempcombatid;
                } else if (user.team.combat != user.tempcombat) {
                  user.team.combat = user.tempcombat;
                  game.switchCombatScreen(user.tempcombat);
                }
              }
            }
          }
        } else if (user.map) {
          // 队长判断
          if (user.isleader) {
            // 创建队伍
            game.createdTeam(user.map.id);
          }
          // 队员判断
          if (user.teamleader) {
            // 获取队伍
            game.getTeamList(user.map.id);
            if (user.teams) {
              // 找到队伍之后就加入队伍
              const team = user.teams.find(t => t.leader.nickname === user.teamleader);
              if (team) {
                // 判断有没有满队，满队加不进，队长直接解散队伍
                if (team.users.length == (team.combat || {}).player_num){
                  if (!user.teamleader.includes(user.teamleader)) {
                    if (!fullTeamLeader.includes(user.teamleader)) {
                      fullTeamLeader.push(user.teamleader);
                    }
                  }
                } else {
                  game.addTeam(team._id);
                }
              } else {
                // 没找到队伍，需要队长看看是不是卡队员了
                if (!teammateNotInTeam.includes(user.teamleader)) {
                  teammateNotInTeam.push(user.teamleader);
                }
              }
            }
          }
        }

        // 队伍状态异常，需要刷新重新接收所有东西
        if (user.teamStatus === 'leave') {
          fms.contentWindow.location.reload();
        }
      })
    }, 12000);

    const mdata = window.monsterData.data;
    const skillMap = {};
    mdata.map(md => {
      md.skill && md.skill.map(sk => {
        skillMap[sk.name] = sk;
      });
    });
    this.skillMap = skillMap;
  },
  methods: {
    frameLoad (index) {
      if (index != 0) return;
      this.msgList = this.$refs['userFrame'][0].contentWindow.chatMsg;
      this.screens = this.$refs['userFrame'][0].contentWindow.screens;
    },
    getDmColor (msg) {
      // 回收弹幕
      setTimeout(() => {
        const dmindex = this.msgDm.findIndex(m => m.key == msg.key);
        this.msgDm.splice(dmindex, 1);
      }, 20000);
      if (msg.channel == 0) {
        return 'volcano';
      }
      return msg.nickname == this.userList[0].email ? 'primary': 'success';
    },
    handleSendChat () {
      this.$refs['userFrame'][0].contentWindow.game.chatSend(this.sendMsg);
      this.sendMsg = '';
    },
    async handleLogin () {
      const formInline = this.formInline;
      if (!formInline.user || !formInline.password) {
        this.$Message.error('账号密码没填好');
        return;
      }
      this.onAddUser(formInline.user, formInline.password);
    },
    /**
     * 将账号密码保存到 localStorage 中
     * @param {*} email
     * @param {*} password
     */
    saveStorageUser: function (email, password) {
        let users = this.getStorageUser();
        if ('undefined' == typeof password) {
            delete users[email];
            localStorage.removeItem(email);
        } else {
            users[email] = password;
        }
        localStorage.setItem('ydxxGame_userList', JSON.stringify(users));
    },
    /**
     * 从 localStorage 中取出账号密码
     * @param {*} email 可选
     */
    getStorageUser: function (email) {
        let users = JSON.parse(localStorage.getItem('ydxxGame_userList') || '{}') || {};
        return email ? (users[email] || null) : users;
    },
    /**
      * 页面表单 添加用户
      * @param {*} event
      */
    onAddUser: function (email, passwd) {
      // 保存账号密码
      this.saveStorageUser(email, passwd);
      // 添加进去
      this.userList.push({ email, isLogin: true, password: passwd });
    },
    handleReload (index) {
      this.$refs['userFrame'][index].contentWindow.location.reload();
    },
    /**
      * 删除用户
      * @param {*} row
      */
    deleteUser: function (email) {
      const user = this.userList.find(ul => ul.email === email);
      const index = this.userList.indexOf(user);
      // 从列表删除此用户
      this.userList.splice(index, 1);

      // 更新保存用户
      this.saveStorageUser(email);
    }
  }
}
</script>
<style lang="less">
.moling {
  position: fixed;
  top: 10px;
  font-size: 60px;
  z-index: 999999999;
  color: #aa2121;
  transform: translate(-50%, 0);
}
@keyframes molingframe {
  0% {
    text-shadow: 0 0 4px white, 0 -5px 4px #ff3, 2px -10px 6px #fd3,
      -2px -15px 11px #f80, 2px -25px 36px #f20;
  }
  25% {
    text-shadow: 0 0 4px white, 2px -7px 6px #ff3, 2px -12px 8px #fd3,
      -3px -20px 11px #f80, 4px -30px 22px #f20;
  }
  50% {
    text-shadow: 0 0 4px white, 2px -10px 8px #ff3, 2px -14px 10px #fd3,
      -4px -25px 11px #f80, 4px -35px 25px #f20;
  }
  75% {
    text-shadow: 0 0 4px white, 2px -7px 6px #ff3, 2px -12px 8px #fd3,
      -3px -20px 11px #f80, 4px -30px 22px #f20;
  }
  100% {
    text-shadow: 0 0 4px white, 0 -5px 4px #ff3, 2px -10px 6px #fd3,
      -2px -15px 11px #f80, 2px -25px 36px #f20;
  }
}
</style>
<style lang="less" scoped>
.home {
  padding: 16px;
  position: relative;
  overflow-x: hidden;
  height: 100%;
  .formitem {
    width: 100px;
  }
  .dm {
    word-break: keep-all;
    position: fixed;
    z-index: 9999;
    animation: dmframe 20s linear;
    top: 0;
    left: 100%;
    @keyframes dmframe {
      0% { left: 100%; }
      100% { left: -100%; }
    }
  }
  .card-container {
    width: 100%;
    .card {
      display: inline-block;
      width: 100%;
      height: 430px;
      margin: 0 8px 8px 0;
      vertical-align: top;;
    }
  }
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
}
</style>
