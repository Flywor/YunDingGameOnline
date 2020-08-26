<template>
  <div class="home">
    <Form
      ref="formInline"
      :model="formInline"
      :rules="{
        user: [ { required: true, message: '请输入账号' } ],
        password: [
          { required: true, message: '请输入密码' },
          { type: 'string', min: 6, message: '密码至少6位' }
        ]
      }"
      inline
    >
      <FormItem prop="user">
        <Input type="text" v-model="formInline.user" placeholder="账号" />
      </FormItem>
      <FormItem prop="password">
        <Input type="password" v-model="formInline.password" placeholder="密码"/>
      </FormItem>
      <FormItem>
        <Button type="primary" @click="handleLogin">添加账号</Button>
      </FormItem>
    </Form>
    <div class="card-container">
      <Card :title="user.email" class="card" v-for="(user, index) in userList" :key="user.email">
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
    </div>
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
    <div class="chart">
      <Input search enter-button="发送" placeholder="想唠点啥？？？？" @on-search="handleSendChat" v-model="sendMsg"/>
    </div>
  </div>
</template>

<script>
import { sleep, randomNum } from "@libs/tools";
export default {
  name: 'Home',
  data () {
    return {
      randomNum,
      baseUrl: `${location.origin}${location.pathname}`,
      formInline: {
        user: '',
        password: ''
      },
      userList: [],
      showChat: false,
      msgList: [],
      msgDm: [],
      sendMsg: '',
      dmline: 0
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
  },
  methods: {
    frameLoad (index) {
      if (index != 0) return;
      this.msgList = this.$refs['userFrame'][0].contentWindow.chatMsg
    },
    getDmColor (msg) {
      if (msg.channel == 0) {
        return 'volcano'
      }
      // 回收弹幕
      setTimeout(() => {
        const dmindex = this.msgList.findIndex(m => m.key == msg.key)
        this.msgList.splice(dmindex, 1)
      }, 20000)
      return msg.nickname == this.userList[0].email ? 'primary': 'success'
    },
    handleSendChat () {
      this.$refs['userFrame'][0].contentWindow.game.chatSend(this.sendMsg)
      this.sendMsg = ''
    },
    async handleLogin () {
      const rs = await this.$refs['formInline'].validate()
      if (rs) {
        this.onAddUser(this.formInline.user, this.formInline.password)
      }
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
      this.userList.push({ email, password: passwd })
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
      width: calc(20% - 8px);
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
  .chart {
    position: fixed;
    bottom: 8px;
    right: 8px;
    width: 50%;
  }
}
</style>
