<template>
   <!-- 人物属性↓ -->
  <CellGroup>
    <Cell
      v-for="(value, key) in userInfo"
      :key="key"
      :title="key"
      :extra="`${value}`"
    />
  </CellGroup>
  <!-- 人物属性↑ -->
</template>
<script>
export default {
  name: 'userinfo',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {}
  },
  computed: {
    userInfo() {
      const obj = this.user.myInfo;
      let info = {};
      if (obj) {
        info = {
          等级: obj.level,
          经验: Math.round(obj.exp),
          气血: obj.hp_cap,
          魔法: obj.mp,
          命中: obj.hit,
          物理伤害: obj.physical_damage,
          物理防御: obj.physical_defense,
          魔法伤害: obj.magic_damage,
          魔法防御: obj.magic_defense,
          治疗能力: obj.restore_damage,
          速度: obj.speed,
          物理暴击: obj.physical_crit,
          法术暴击: obj.magic_crit,
          体质: obj.con,
          魔力: obj.int,
          力量: obj.str,
          耐力: obj.vit,
          敏捷: obj.agi,
          潜力: obj.potential_num,
          躲避: obj.dodge,
          活力: Math.round(obj.vitality_num),
          气血储备: Math.round(obj.hp_store),
          魔法储备: Math.round(obj.mp_store),
          宝宝经验: Math.round(obj.pet_exp),
        };
      }
      return info;
    }
  }
}
</script>
<style lang="less" scoped>

</style>