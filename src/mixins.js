export default {
  data () {
    return {
      rareType: ["普通", "稀有", "传说", "PY"]
    }
  },
  filters: {
    addStyle_mixin (val) {
      const arr1 = ["体质", "魔力", "力量", "耐力", "敏捷"];
      const arr2 = ["物理暴击", "法术暴击", "特技"];

      if (arr1.includes(val)) {
        return "color:green;font-weight: 600;";
      }
      if (arr2.includes(val)) {
        return "color:orchid;";
      }
      return "";
    },
    getIndex_mixin (val) {
      const index = val + 1;
      return index.toString();
    }
  },
  methods: {
    async useItem_mixin (readUse) {
      const { useNum, id, name } = readUse;
      if (!useNum || useNum < 0) return this.$Message.error('请输入正确的数量')
      window.freshPackage = false;
      this.$Spin.show({
        render: () => (
          <p>
            正在连续使用物品{name}
            {useNum}
            个，为避免请求次数过多和程序错乱，在此窗口关闭后再进行其他操作
          </p>
        ),
      });
      for (let i = 0; i < useNum; i++) {
        this.game.useGoods(id);
        await sleep(1100);
      }
      window.freshPackage = true;
      this.game.userInfo();
      // 重置背包
      this.user.goods = [];
      this.user.goodsPage = 1;
      this.game.getMyGoods();
      this.readToUse = null;
      this.$Spin.hide();
    },
    //用于生成装备展示信息
    getEqsInfo_mixin (obj) {
      const eq_data = {
        佩戴等级: obj.wear_level,
        物理伤害: obj.physical_damage,
        物理防御: obj.physical_defense,
        魔法伤害: obj.magic_damage,
        魔法防御: obj.magic_defense,
        治疗能力: obj.restore_damage,
        气血: obj.a,
        速度: obj.speed,
        体质: obj.con,
        魔力: obj.int,
        力量: obj.str,
        耐力: obj.vit,
        敏捷: obj.agi,
        物理暴击: obj.physical_crit,
        法术暴击: obj.magic_crit,
        特技: obj.skill ? `${obj.skill.name}--${obj.skill.info}` : "",
        评分: Math.round(obj.score),
      };
      let eq_info = {};
      for (const key in eq_data) {
        if (eq_data.hasOwnProperty(key)) {
          const element = eq_data[key];
          if (element) {
            eq_info[key] = element;
          }
        }
      }
      return eq_info;
    }
  }
}