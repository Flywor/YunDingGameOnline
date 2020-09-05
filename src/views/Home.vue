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
        <Input type="password" v-model="SCKEY" @on-change="handleSCKEYChange" placeholder="serverChan SCKEY" />
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
    <iframe :src="serverChanUrl" v-if="serverChanUrl" @onload="serverChanUrl = null" style="display:none;"/>
    <Drawer
      v-model="showSkillMap"
      :mask="false"
      width="500px"
      title="技能图鉴"
    >
      <Alert
        v-for="(value,key) in skillMap"
        :key="key"
        style="margin-bottom: 8px;"
      >
        {{key}}
        【{{value}}】
      </Alert>
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
import { sleep, randomNum } from "@libs/tools";
export default {
  name: 'Home',
  components: { ScreensComponent, MonsterMapComponent },
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
      SCKEY: localStorage.getItem('sckey'),
      serverChanUrl: null,
      showSkillMap: false,
      skillMap: {},
      showMonsterMap: false,
      showScreensContent: false,
      screens: []
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
    // 加载历史账号
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

    // 每隔5分钟检测有没有队伍
    setInterval(() => {
      if (!this.SCKEY) return
      const frames = this.$refs['userFrame']
      const emptyTeamUser = []
      frames.map(fms => {
        const us = fms.contentWindow.user
        if (!us.team) {
          emptyTeamUser.push(us.email)
        }
      })
      if (emptyTeamUser.length === 0) return
      this.serverChanUrl = `https://sc.ftqq.com/${this.SCKEY}.send?text=来自夏影的温馨提醒&desp=你的这些账号[${emptyTeamUser.join('，')}]已经不在队伍里面，我怀疑已经掉线了`
    }, 310000);

    const mdata = window.monsterData.data;
    const skillMap = {};
    mdata.map(md => {
      md.skill && md.skill.map(sk => {
        skillMap[sk.name] = sk.info;
      });
    });
    this.skillMap = skillMap;
  },
  methods: {
    handleSCKEYChange () {
      localStorage.setItem('sckey', this.SCKEY);
    },
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
