<template>
  <!-- 背包↓ -->
  <div>
    <div
      slot="header"
      class="good-header"
    >
      <span>储物戒指</span>
      <Button
        size="small"
        type="primary"
        @click="() => game.allSellGoods()"
      >
        整理
      </Button>
      <Input
        v-model="searchText"
        suffix="ios-search"
        placeholder="名称、说明、属性值"
        style="width: 66%"
      />
    </div>
    <div class="goods-box">
      <Badge
        v-for="item in goods"
        :key="item.id"
        :count="item.selected"
        overflow-count="999"
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
          <Input v-model="readToUse.useNum" type="number">
            <span slot="prepend">数量</span>
          </Input>
          <Input v-model="readToUse.sellPrice" type="number">
            <span slot="prepend">总价</span>
          </Input>
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
              @click="handleSellGoods"
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
  </div>
  <!-- 背包↑ -->
</template>
<script>
export default {
  name: 'bag',
  data () {
    return {
      user: window.user,
      game: window.game,
      readToUse: null,
      searchText: '',
      selectedGoods: []
    }
  },
  mounted () {
    this.bagInit();
  },
  computed: {
    // 背包物品初始化
    goods () {
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
            const eq_info = this.getEqsInfo_mixin(ele.info);
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
    }
  },
  methods: {
    // 背包数据初始化
    bagInit () {
      this.user.goods = [];
      this.user.goodsPage = 1;
      this.game.getMyGoods();
    },
    // 使用物品
    async handleUseItem() {
      this.useItem_mixin(this.readToUse);
    },
    // 装备物品
    handleWearItem() {
      const { id } = this.readToUse;
      this.game.wearUserEquipment(id);
    },
    // 分解物品
    handleSellItem() {
      const { useNum, id, name } = this.readToUse;
      if (!useNum || useNum < 0) return this.$Message.error('请输入正确的数量')
      this.game.sellGoods([{ id, num: useNum }]);
      this.readToUse = null;
    },
    // 上架市场
    handleSellGoods () {
      const { useNum, id, name, sellPrice } = this.readToUse;
      if (!useNum || useNum < 0) return this.$Message.error('请输入正确的数量')
      if (!sellPrice || sellPrice < 0) return this.$Message.error('请输入正确的总价')
      this.game.playerSellGoods(id, sellPrice, useNum);
      this.readToUse = null;
    },
    // 选择物品
    selectGood() {
      const { useNum, id } = this.readToUse;
      if (!useNum || useNum < 0) return this.$Message.error('请输入正确的数量')
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
    // 合成物品
    makeGoods () {
      this.game.makeGoods(this.selectedGoods);
      this.selectedGoods = [];
    },
    // 物品操作
    goodsHandle (val) {
      this.readToUse = val;
      this.readToUse.useNum = 1;
    }
  }
}
</script>
<style lang="less">
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
</style>