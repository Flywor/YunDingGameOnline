<template>
  <!-- 商城↓ -->
  <div>
    <div class="goods-box">
      <Button
        v-for="(item, _id) in goods"
        :key="_id"
        size="small"
        class="good-name"
        :style="item.style"
        @click="currentGood = item"
      >
        <label v-html="item.name"></label>
      </Button>
    </div>
    <div class="info-box">
      <div class="basci-info">
        <span :style="currentGood.style">{{currentGood.name}}</span>
        <span :style="currentGood.style">价格：{{currentGood.price}}</span>  
        <span :style="currentGood.style">{{currentGood.info}}</span>
      </div>
      <Button 
        size="small"
        type="primary"
        @click="game.byGoodsToSystem(2,currentGood._id)" 
      >
        购买
      </Button>
    </div>
  </div>
  <!-- 商城↑ -->
</template>
<script>
export default {
  name: 'shop',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      currentGood: {}
    }
  },
  mounted () {
    this.game.getSystemSellGoods()
  },
  computed: {
    goods () {
      let arr = [];
      if (this.user.shop) {
        this.user.shop.goods.forEach((ele) => {
          const { name, info, style, _id } = ele;
          const price_type = [null, "灵石", "仙石"];
          const price = ele.price_type
            ? `${ele.price}${
                price_type[ele.price_type]
              }`
            : null; 

          let obj = {
            name,   //名称
            price, //价格
            info, //描述
            style, //文字样式
            _id //物品id
          };
          arr.push(obj);
        });
        return arr;
      }
    }
  }
}
</script>
<style lang="less" scoped>
.goods-box {
  padding-bottom: 180px;
  .good-name {
    margin: 0 0.5% 5px 0;
    width: 49%;
    font-size: 12px !important;
  }
}
.info-box {
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
  .basci-info{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>