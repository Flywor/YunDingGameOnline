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
        <iframe v-if="user.isLogin" ref="userFrame" :src="`${baseUrl}#/user/${user.email}`" />
      </Card>
    </div>
    <Drawer
      v-if="userList[0]"
      :title="`消息箱 -- ${userList[0].email}`"
      :closable="false"
      :value="true"
      width="300px"
      :mask="false"
    >
      <div class="chat">
        <div class="chat-msg">
          <p v-for="(msg, i) in msgList" :key="i">
            <Tag
              :style="{ float: msg.nickname == userList[0].email ? 'right': 'left' }"
              :color="msg.nickname == userList[0].email ? 'primary': 'success'"
              size="large"
            >
              {{msg.nickname}}：{{msg.msg}}
            </Tag>
          </p>
        </div>
        <Divider />
        <div class="chat-send">
          <Input search enter-button="发送" placeholder="想唠点啥？？？？" @on-search="handleSendChat" v-model="sendMsg"/>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script>
import { sleep } from "@libs/tools";
export default {
  name: 'Home',
  data () {
    return {
      baseUrl: `${location.origin}${location.pathname}`,
      formInline: {
        user: '',
        password: ''
      },
      userList: [],
      showChat: false,
      msgList: [],
      sendMsg: ''
    }
  },
  watch: {
    userList: {
      deep: true,
      async handler (userList) {
        if (!userList || userList.length === 0) {
          this.showChat = false
          this.msgList = []
          this.sendMsg = ''
          return
        }
        const first = userList[0]
        await sleep(() => this.$refs['userFrame'])
        await sleep(() => this.$refs['userFrame'][0].contentWindow.chatMsg)
        this.msgList = this.$refs['userFrame'][0].contentWindow.chatMsg
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
  },
  methods: {
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
  .card-container {
    width: calc(100% - 280px);
    .card {
      display: inline-block;
      width: calc(33% - 8px);
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
.chat {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  .chat-msg {
    flex: 1;
    padding: 16px 16px 0 16px;
    overflow: auto;
    p {
      height: 32px;
    }
  }
  .chat-send {
    margin: 0 24px 24px 24px;
  }
}
</style>
