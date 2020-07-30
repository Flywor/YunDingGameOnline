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
          <a @click="handleReload(index)">重新加载</a>
          &nbsp;
          <a @click="deleteUser(user.email)">删除</a>
        </div>
        <iframe ref="userFrame" :src="`${baseUrl}#/user/${user.email}`" />
      </Card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      baseUrl: `${location.origin}${location.pathname}`,
      formInline: {
        user: '',
        password: ''
      },
      userList: []
    }
  },
  mounted () {
    // 加载历史账号
    const users = this.getStorageUser();
    const userList = []
    Object.keys(users).forEach((email) => {
      userList.push({ email, password: users[email] });
    });
    this.userList = userList
  },
  methods: {
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
    .card {
      display: inline-block;
      width: calc(20% - 8px);
      height: 450px;
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
