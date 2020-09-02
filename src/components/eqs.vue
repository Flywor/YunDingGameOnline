<template>
  <!-- 人物装备↓ -->
  <Collapse simple>
    <Panel
      :name="index | getIndex_mixin"
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
          <span :style="key | addStyle_mixin">{{key}}：</span>
          <span :style="key | addStyle_mixin">{{value}}</span>
        </div>
      </div>
    </Panel>
  </Collapse>
  <!-- 人物装备↑ -->
</template>
<script>
export default {
  name: 'eqs',
  data () {
    return {
      user: window.user,
      game: window.game
    }
  },
  computed: {
    // 装备信息
    eqsInfo () {
      let arr = [];
      this.user.userEqs &&
        this.user.userEqs.forEach((ele) => {
          const obj = this.getEqsInfo_mixin(ele);
          const { name, style, img } = ele;
          arr.push({
            name,
            style,
            img,
            info: obj,
          });
        });
      return arr;
    }
  }
}
</script>
<style lang="less" scoped>

</style>