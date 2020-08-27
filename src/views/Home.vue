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
      <FormItem class="formitem">
        <Button type="primary" size="small" @click="handleLogin">添加账号</Button>
      </FormItem>
      <FormItem>
        <Input type="password" v-model="SCKEY" @on-change="handleSCKEYChange" placeholder="serverChan SCKEY" />
      </FormItem>
      <FormItem>
        弹幕
        <i-switch v-model="openDm" @on-change="handleDMflag">
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
            :xxl="4"
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
    <div v-show="openDm">
      <Tag
        v-for="msg in msgDm"
        :key="msg.key"
        class="dm"
        :style="{ top: `${msg.top * 32}px` }"
        :color="msg.color"
        size="large"
      >
        {{msg.nickname || '系统'}}：<label v-html="msg.msg" />
      </Tag>
    </div>
    <iframe :src="serverChanUrl" v-if="serverChanUrl" @onload="serverChanUrl = null" style="display:none;"/>
  </div>
</template>

<script>
let lastServerChanSend = 0;

import { sleep, randomNum } from "@libs/tools";
export default {
  name: 'Home',
  data () {
    const dmflag = localStorage.getItem('dmflag')
    return {
      randomNum,
      baseUrl: `${location.origin}${location.pathname}`,
      formInline: {
        user: '',
        password: ''
      },
      userList: [],
      showChat: false,
      openDm: dmflag ? dmflag === 'true': true,
      msgList: [],
      msgDm: [],
      sendMsg: '',
      dmline: 0,
      SCKEY: localStorage.getItem('sckey'),
      serverChanUrl: null
    }
  },
  watch: {
    'msgList.length': {
      deep: true,
      handler (length) {
        if (length === 0) return
        const dm = this.msgList[length - 1]
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
  },
  methods: {
    handleDMflag () {
      localStorage.setItem('dmflag', this.openDm)
    },
    handleSCKEYChange () {
      localStorage.setItem('sckey', this.SCKEY)
    },
    frameLoad (index) {
      if (index != 0) return;
      this.msgList = this.$refs['userFrame'][0].contentWindow.chatMsg
    },
    getDmColor (msg) {
      // 回收弹幕
      setTimeout(() => {
        const dmindex = this.msgDm.findIndex(m => m.key == msg.key)
        this.msgDm.splice(dmindex, 1)
      }, 20000)
      if (msg.channel == 0) {
        return 'volcano'
      }
      return msg.nickname == this.userList[0].email ? 'primary': 'success'
    },
    handleSendChat () {
      this.$refs['userFrame'][0].contentWindow.game.chatSend(this.sendMsg)
      this.sendMsg = ''
    },
    async handleLogin () {
      const formInline = this.formInline;
      if (!formInline.user || !formInline.password) {
        this.$Message.error('账号密码没填好');
        return;
      }
      this.onAddUser(formInline.user, formInline.password)
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
            localStorage.removeItem(email)
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
      this.userList.push({ email, isLogin: true, password: passwd })
    },
    handleReload (index) {
      this.$refs['userFrame'][index].contentWindow.location.reload()
    },
    /**
      * 删除用户
      * @param {*} row
      */
    deleteUser: function (email) {
      const user = this.userList.find(ul => ul.email === email)
      const index = this.userList.indexOf(user)
      // 从列表删除此用户
      this.userList.splice(index, 1);

      // 更新保存用户
      this.saveStorageUser(email);
    }
  }
}
</script>
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
    position: absolute;
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
