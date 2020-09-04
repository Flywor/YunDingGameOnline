<template>
  <div>
    <div class="br" />
    捕捉指定
    <i-switch v-model="user.catchType" size="large" true-color="#2db7f5" false-color="#2d8cf0">
      <span slot="open">技能</span>
      <span slot="close">宠物</span>
    </i-switch>
    &nbsp;
    <template v-if="user.catchType">
      <Select v-model="user.catchSkills" multiple size="small" style="width: auto;">
        <Option
          v-for="skill in skillList"
          :value="skill"
          :key="skill"
        >
          {{skill}}
        </Option>
      </Select>
      &nbsp;
      <!-- <Checkbox v-model="user.isCompose" border>自动合成拥有指定所有技能的宠</Checkbox> -->
    </template>
    <Select v-else v-model="user.catchPet" multiple size="small" style="width: auto;">
      <Option
        v-for="monster in monsterList"
        :value="monster.name"
        :key="monster.name"
      >
        {{monster.name}}
      </Option>
    </Select>
    <div class="br" />
  </div>
</template>
<script>
export default {
  name: 'pet-catch-ctrl',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {
    }
  },
  computed: {
    monsterList () {
      return window.monsterData.data.filter(d => d.type !== 3).sort((n, m) => n.growing_num - m.growing_num);
    },
    skillList () {
      const skillMap = {};
      this.monsterList.filter(ml => ml.skill).map(ml => {
        ml.skill.map(sk => {
          skillMap[sk.name] = ml.name;
        });
      });
      return Object.keys(skillMap);
    }
  },
  watch: {
    'user.catchSkills': {
      deep: true,
      handler (cs) {
        // const catchSkillCopy = JSON.parse(JSON.stringify(cs));
        // const catchPetBySkill = [];
        // // 匹配包含选择技能最多的怪，没有就一只一只抓
        // this.monsterList
        //   .filter(ml => ml.skill)
        //   .map(ml => {
        //     let count = 0;
        //     ml.skill.map(sk => {
        //       if (catchSkillCopy.includes(sk.name)) {
        //         count++;
        //       }
        //     });
        //     ml.tempCount = count;
        //     return ml;
        //   })
        //   .filter(ml => ml.tempCount > 0)
        //   .sort((a, b) => b.tempCount - a.tempCount)
        //   .map(ml => {
        //     if (catchSkillCopy.length === 0) return;
        //     catchPetBySkill.push(ml.name);
        //     ml.skill.map(sk => {
        //       let index = catchSkillCopy.findIndex(csc => csc === sk.name);
        //       if (index > -1) {
        //         catchSkillCopy.splice(index, 1);
        //       }
        //     });
        //   });
        //console.log(catchPetBySkill);
      }
    }
  },
  mounted () {
  }
}
</script>
<style lang="less" scoped>

</style>