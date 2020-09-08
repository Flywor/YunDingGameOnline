<template>
  <div>
    <h3 style="padding-bottom: 16px;">
      筛选：
      <Dropdown @on-click="name => skillType = name">
        <a>
          {{skillType}}
        </a>
        <DropdownMenu slot="list">
          <DropdownItem name="全部">全部</DropdownItem>
          <DropdownItem name="物理">物理</DropdownItem>
          <DropdownItem name="魔法">魔法</DropdownItem>
          <DropdownItem name="治疗">治疗</DropdownItem>
          <DropdownItem name="被动">被动</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </h3>
    <Card
      v-for="value in skillList"
      :key="value.name"
      :title="value.name"
      style="margin-bottom: 8px;"
    >
      <p>{{value.info}}</p>
      <p>
        技能类型：{{(() => {
          let txt = '被动';
          switch (value.hurt_field) {
            case "magic_damage":
              txt = '魔法';
              break;
            case "physical_damage":
              txt = '物理';
              break;
            case "restore_damage":
              txt = '治疗';
              break
          }
          return txt;
        })()}}
      </p>
      <p v-if="value.unit === value.unit_highest">
        作用单位：{{value.unit}}
      </p>
      <p v-else>
        作用单位：{{value.unit}} ~ {{value.unit_highest}}
      </p>
      <p v-if="value.real_damage">基础伤害：{{value.real_damage}}</p>
      <p>伤害波动：{{value.min_hurt}} ~ {{value.max_hurt}}</p>
      <p v-if="value.consume_num">消耗：{{value.consume_num}}魔法</p>
      <p>加入时间：<Time :time="value.created_at" /></p>
    </Card>
  </div>
</template>
<script>
export default {
  name: 'skill-map',
  props: {
    skillMap: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      skillType: '技能类型'
    }
  },
  computed: {
    skillList () {
      let list = Object.keys(this.skillMap).map(key => this.skillMap[key]).sort((a, b) => a.level - b.level);
      switch (this.skillType) {
        case '物理':
          list = list.filter(l => l.hurt_field === 'physical_damage');
          break;
        case '魔法':
          list = list.filter(l => l.hurt_field === 'magic_damage');
          break;
        case '治疗':
          list = list.filter(l => l.hurt_field === 'restore_damage');
          break;
        case '被动':
          list = list.filter(l => !l.hurt_field);
          break;
      }
      return list;
    }
  }
}
</script>
<style lang="less" scoped>

</style>