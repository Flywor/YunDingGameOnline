<template>
  <div>
    <Form ref="formInline" inline>
      <FormItem>
        <Select v-model="monsterSearch.skills" filterable multiple placeholder="怪物包含的技能">
          <Option
            v-for="(value, key) in skillMap"
            :key="key"
            :value="key"
          >{{key}}</option>
        </Select>
      </FormItem>
      <FormItem>
        <Select v-model="monsterSearch.rare" multiple placeholder="怪物品质">
          <Option
            v-for="(txt, i) in rareType"
            :key="txt"
            :value="i"
          >{{txt}}</option>
        </Select>
      </FormItem>
      <FormItem>
        <Button type="primary" @click="handlerSearchMonster">搜索</Button>
      </FormItem>
    </Form>
    <h1 v-if="monsterMap.length === 0">没有结果，你得重新搜索</h1>
    <Card
      v-for="monster in monsterMap"
      :key="monster._id"
      style="margin: 0 8px 8px 0;display:inline-block;width: 200px;vertical-align: top;"
      :title="monster.name"
    >
      <p>等级：{{monster.level || '作者没写'}}</p>
      <p>出没副本：{{monster.map || '作者没写'}}</p>
      <p>成长：{{monster.growing_num}}</p>
      <p>品质：{{rareType[monster.type]}}</p>
      <p>躲避资质：{{monster.dodge_zz}}</p>
      <p>攻击资质：{{monster.str_zz}}</p>
      <p>法力资质：{{monster.int_zz}}</p>
      <p>体力资质：{{monster.con_zz}}</p>
      <p>防御资质：{{monster.vit_zz}}</p>
      <p>速度资质：{{monster.speed_zz}}</p>
      <p>躲避资质：{{monster.dodge_zz}}</p>
      <template v-if="monster.skill && monster.skill.length > 0">
        <p>携带技能：</p>
        <Tooltip v-for="skill in monster.skill" :key="`${monster._id}${skill._id}`" word-wrap>
          <Tag color="primary" type="border">
            {{skill.name}}
          </Tag>
          <div slot="content">
            {{skill.info}}
          </div>
        </Tooltip>
      </template>
    </Card>
  </div>
</template>
<script>
export default {
  name: 'monster-map',
  props: {
    skillMap: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      monsterMap: [],
      monsterSearch: {}
    }
  },
  methods: {
    handlerSearchMonster () {
      const mdata = window.monsterData.data;
      const { skills, rare } = this.monsterSearch;
      this.monsterMap = mdata.filter(d => {
        let flag = true;
        if (rare && rare.length > 0) {
          flag = rare.includes(d.type);
        }
        if (flag && skills && skills.length > 0) {
          if (d.skill) {
            flag = d.skill.some(skl => skills.includes(skl.name));
          } else {
            flag = false;
          }
        }
        return flag;
      });
    }
  }
}
</script>
<style lang="less" scoped>

</style>