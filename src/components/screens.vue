<template>
  <div>
    <p v-if="screens.length === 0">你得至少登录一个账号，我才能拿到数据</p>
    <Card v-for="screen in screens" :key="screen._id" :title="screen.name" style="margin-bottom: 8px;">
      <p>队伍最大人数：{{screen.player_num}}</p>
      <p>怪物等级：{{screen.min_level}} ~ {{screen.max_level}}</p>
      <p>出没怪物：
        <Tag v-for="(monsterId, i) in screen.monster" :key="`${i}-${monsterId}`" color="magenta">
          {{getMonster(monsterId, screen.name)}}
        </Tag>
      </p>
      <p>掉落物品：
        <Tag v-for="gds in screen.must_goods" :key="`must-${gds._id}`" color="purple">
          {{gds.name}}[100%]
        </Tag>
        <Tag v-for="(gds, i) in screen.random_goods" :key="gds._id" color="cyan">
          {{gds.name}}[{{screen.random_arr[i].rate * 100}}%]
        </Tag>
      </p>
    </Card>
  </div>
</template>
<script>
export default {
  name: 'screens',
  props: {
    screens: { type: Array, default: () => [] }
  },
  data () {
    return {}
  },
  methods: {
    getMonster (monsterId, screenName) {
      const monster = window.monsterData.data.find(md => md._id === monsterId)
      if (!monster) return '无数据';
      monster.map = screenName;
      return monster.name;
    }
  }
}
</script>
<style lang="less" scoped>

</style>