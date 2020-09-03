<template>
  <!-- 人物技能↓ -->
  <div>
    <template v-if="user.arms">
      <Tag v-for="arm in user.arms" :key="arm.name">
        {{arm.name}}[{{arm.exp}}/{{arm.needExp}}]
      </Tag>
      <div class="br" />
      <div class="br" />
      <div class="br" />
      <Input v-model="upSkillNum" type="number">
        <Select transfer v-model="upSkillType" slot="prepend" style="width: 100px">
          <Option :value="1">剑修</Option>
          <Option :value="2">枪修</Option>
          <Option :value="3">锤修</Option>
          <Option :value="4">伞修</Option>
        </Select>
        <Button slot="append" type="primary" size="small" @click="handleFationSkill">确定</Button>
      </Input>
    </template>
    <template v-if="user.skills">
      <div v-for="skill in user.skills" :key="skill._id">
        <div class="br" />
        <div class="br" />
        <div class="br" />
        {{skill.name}}：
        <ButtonGroup size="small">
          <Button @click="() => game.upLevelUserSkill(1, skill._id)">
            基础伤害{{skill.real_damage}}
            <Icon type="md-arrow-round-up" />
          </Button>
          <Button @click="() => game.upLevelUserSkill(2, skill._id)">
            属性波动【{{skill.min_hurt.toFixed(2)}} ~ {{skill.max_hurt.toFixed(2)}}】
            <Icon type="md-arrow-round-up" />
          </Button>
          <Button @click="() => game.upLevelUserSkill(3, skill._id)">
            作用单位【{{skill.unit}}】
            <Icon type="md-arrow-round-up" />
          </Button>
        </ButtonGroup>
      </div>
    </template>
  </div>
  <!-- 人物技能↑ -->
</template>
<script>
export default {
  name: 'skills',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      upSkillNum: 50,
      upSkillType: 1
    }
  },
  methods: {
    async handleFationSkill(type) {
      if (this.upSkillNum <= 0) {
        this.$Message.error('大胸弟，别搞事情');
        return;
      }
      if (this.upSkillNum * 20000 > this.user.myInfo.game_silver) {
        this.$Message.error('大胸弟，你钱不够啊');
        return;
      }
      this.$Spin.show({
        render: () => (
          <p>
            正在自动连点技能，为避免请求次数过多和程序错乱，在此窗口关闭后再进行其他操作
          </p>
        ),
      });
      for (let i = 0; i < this.upSkillNum; i++) {
        this.game.repairUserArms(this.upSkillType);
        await sleep(100);
      }
      this.game.userInfo();
      this.game.getMySkill();
      this.$Spin.hide();
    }
  }
}
</script>
<style lang="less" scoped>

</style>