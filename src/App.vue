<template>
  <div id="app">
    <router-view/>
  </div>
</template>
<script>
export default {
  mounted () {
    this.$Message.config({
      background: true,
      duration: 3
    })
  }
}
</script>
<style lang="less">
html, body, #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  padding: 0;
}
.ivu-card-body {
  width: 100%;
  height: calc(100% - 51px);
  padding: 8px!important;
}
</style>
