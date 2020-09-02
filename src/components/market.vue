<template>
  <!-- 市场↓ -->
  <div>
    <Form ref="formInline" inline>
      <FormItem>
        <Select v-model="user.market.type">
          <Option value="1">装备</option>
          <Option value="2">材料</option>
          <Option value="3">技能书</option>
          <Option value="4">制造类</option>
          <Option value="5">宠物蛋</option>
          <Option value="6">珍稀物品</option>
          <Option value="7">法宝材料</option>
          <Option value="8">低级兽决</option>
          <Option value="9">高级兽决</option>
        </Select>
      </FormItem>
      <FormItem>
        <Input type="text" v-model="user.market.keyword" placeholder="物品名称" />
      </FormItem>
      <FormItem>
        <Button type="primary" @click="() => {
          $Spin.show();
          user.market.pageIndex = 1;
          user.market.list = [];
          game.getPlayerSellGoods(user.market.pageIndex, user.market.type);
        }">搜索</Button>
      </FormItem>
    </Form>
    <Collapse>
      <Panel
        v-for="item in user.market.sellGoods"
        :key="item.name"
        :name="item.name"
      >
        {{item.name}} - {{item.count}}在售
        <List slot="content" border size="small">
          <ListItem
            v-for="goods in item.list"
            :key="goods._id"
          >
            <ListItemMeta
              :description="`${(goods.sell_game_gold/goods.count).toFixed(0)}仙石/个，共${goods.count}个【卖家：${goods.user.nickname}】`"
            />
            <template slot="action">
              <li v-if="user.market.type == '1'">
                <Tooltip>
                  <a>属性</a>
                  <div slot="content">
                    <p
                      v-for="(value, key) in getEqsInfo_mixin(goods)"
                      :key="key"
                    >
                      <span :style="key | addStyle_mixin">{{key}}:</span>
                      <span :style="key | addStyle_mixin">{{value}}</span>
                    </p>
                  </div>
                </Tooltip>
              </li>
              <li>
                <InputNumber :max="goods.count" :min="1" v-model="goods.buyNum" />
              </li>
              <li>
                <a @click="() => handleByGoods(goods)">购买</a>
              </li>
            </template>
          </ListItem>
        </List>
      </Panel>
    </Collapse>
  </div>
  <!-- 市场↑ -->
</template>
<script>
export default {
  name: 'market',
  data () {
    return {
      user: window.user,
      game: window.game
    }
  },
  methods: {
    // 购买东西
    handleByGoods (gds) {
      const num = gds.buyNum || 1;
      const name = gds.name || gds.goods.name;
      if (num == gds.count) {
        this.game.byPalyerGoods(gds._id, 2);

        const gdsList = user.market.sellGoods.find(sg => sg.name === name).list;
        const index = gdsList.findIndex(gl => gl._id === gds._id);
        gdsList.splice(index, 1);
      } else {
        for (let i = 0; i < num; i++) {
          gds.count--;
          this.game.byPalyerGoods(gds._id, 1);
        }
      }
      this.$forceUpdate();
      this.$Message.success(`购买${name}${num}个完成`);
    }
  }
}
</script>
<style lang="less" scoped>

</style>