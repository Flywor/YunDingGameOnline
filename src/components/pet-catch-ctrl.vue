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
      <Select v-model="user.catchSkills" multiple size="small" style="max-width: 330px;">
        <Option
          v-for="skill in skillList"
          :value="skill"
          :key="skill"
        >
          {{skill}}
        </Option>
      </Select>
      &nbsp;
      <Checkbox v-model="user.isCompose" border @on-change="handleAutoChange">自动合成</Checkbox>
    </template>
    <Select v-else v-model="user.catchPet" multiple size="small" style="max-width: 300px;">
      <Option
        v-for="screenMonster in screenMonsterMap"
        :value="screenMonster.monsterName"
        :key="screenMonster.monsterName"
      >
        {{screenMonster.monsterName}}
      </Option>
    </Select>
    <div class="br" />
  </div>
</template>
<script>
import { sleep } from "@libs/tools";
export default {
  name: 'pet-catch-ctrl',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      screenMonsterMap: [],
      interval: 0
    }
  },
  computed: {
    skillList () {
      const skillMap = {};
      this.screenMonsterMap.filter(smm => smm.skill).map(smm => {
        smm.skill.map(sk => {
          skillMap[sk.name] = true;
        });
      });
      return Object.keys(skillMap);
    }
  },
  watch: {
    'user.catchSkills': {
      deep: true,
      handler (cs) {
        if (this.screenMonsterMap.length === 0) return;
        const catchSkillCopy = JSON.parse(JSON.stringify(cs || []));
        const catchPetBySkill = [];
        // 匹配包含选择技能最多的怪，没有就一只一只抓
        this.screenMonsterMap
          .map(smm => {
            let count = 0;
            smm.skill && smm.skill.map(sk => {
              if (catchSkillCopy.includes(sk.name)) {
                count++;
              }
            });
            smm.tempCount = count;
            return smm;
          })
          .sort((a, b) => b.tempCount - a.tempCount)
          .map(smm => {
            if (catchSkillCopy.length === 0) return;
            let flag = false;
            smm.skill.map(sk => {
              let index = catchSkillCopy.findIndex(csc => csc === sk.name);
              if (index > -1) {
                catchSkillCopy.splice(index, 1);
                flag = true;
              }
            });
            if (flag) {
              catchPetBySkill.push(smm.monsterName);
            }
          });
        this.user.catchPetBySkill = catchPetBySkill;
        console.log(catchSkillCopy, catchPetBySkill);
      }
    }
  },
  async mounted () {
    await sleep(() => window.screens.length > 0);
    const screenMonsterMap = [];
    const screens = window.screens;
    window.monsterData.data
      .filter(d => d.type !== 3 && d.skill && d.skill.length > 0)
      .map(ml => {
        const screen = screens.find(s => s.monster.includes(ml._id))
        if (screen) {
          screenMonsterMap.push({
            screenId: screen._id,
            screenName: screen.name,
            monsterId: ml._id,
            monsterName: ml.name,
            skill: ml.skill
          });
        }
    });
    this.screenMonsterMap = screenMonsterMap;
    if (this.user.isCompose) {
      this.handleAutoChange(this.user.isCompose);
      this.discardPetInterval();
    }
  },
  methods: {
    // 检查当前副本有没有要捉的宠物
    checkScreenHasPet (petList) {
      if (!this.user.combatName || petList.length === 0) return;
      const monsterList = this.screenMonsterMap.filter(smm => smm.screenName === this.user.combatName);
      return monsterList.some(ml => petList.includes(ml.monsterName));
    },
    // 检查当前副本能抓到的技能
    checkScreenHasSkill () {
      const obj = {};
      this.screenMonsterMap
        .filter(smm => smm.screenName === this.user.combatName)
        .map(smm => smm.skill.map(skl => obj[skl.name] = true ));
      return Object.keys(obj);
    },
    // 查找要抓的宠物在哪个副本
    checkPetInScreen (petName) {
      return this.screenMonsterMap.find(smm => smm.monsterName === petName).screenId;
    },
    // 根据某位置的宠物来判断要切换到哪个副本
    switchCombat (petId) {
      let screenId;
      if (petId) {
        // 查找还没抓到的技能的宠物
        const pet = this.user.myPets.find(pet => pet._id === petId);
        const catchSkills = this.user.catchSkills;
        const skills = pet.skill.map(skl => skl.name);
        let nextSkill;
        catchSkills.map(cs => {
          if (!skill.includes(cs)) {
            nextSkill = cs;
          }
        });
        console.log(nextSkill);
        if (!nextSkill) {
          this.switchCombat();
        }
        const monsterScreen = this.screenMonsterMap.find(smm => smm.skill.some(skl => skl.name === nextSkill));
        screenId = monsterScreen.screenId;
      } else {
        screenId = this.checkPetInScreen(this.user.catchPetBySkill[0]);
      }
      this.user.team.combat = screenId;
      this.game.switchCombatScreen(screenId);
    },
    async handleAutoChange (flag) {
      const catchList = this.user.catchPetBySkill;
      if (!catchList || catchList.length === 0) {
        this.$Message.warning('还没设置捕捉');
        return;
      }
      if (!this.user.team) {
        this.game.createdTeam(this.user.map.id);
        await sleep(() => !!this.user.team);
      }
      if (!this.user.combatName) {
        this.switchCombat();
        await sleep(() => !!this.user.combatName);
      }
      if (!this.user.fighting) {
        this.$set(this.user, 'fighting', true);
        this.game.startCombat(this.user.team.combat);
      }
      if (this.checkScreenHasPet(catchList) === false){
        this.$Message.warning('当前副本没有符合捕捉条件的宠物，正在切换');
        this.switchCombat();
      }
    },
    async discardPetInterval () {
      this.game.getMyPet();
      await sleep(6000);
      const myPets = this.user.myPets;
      const catchSkills = this.user.catchSkills;
      let discardFlag = false;
      for (let i = 0; i < myPets.length; i++) {
        const pet = myPets[i];
        // 放生没技能 或 没有要的技能
        if ((!pet.skill || pet.skill.length === 0) || !pet.skill.some(skl => catchSkills.includes(skl.name))) {
          this.game.upUserPetLevel(pet._id, 3);
          await sleep(1000);
          this.$Message.info(`丢弃${pet.name}技能为【${(pet.skill || []).map(sk => sk.name).join(',') || '空'}】`);
          // 标记丢过
          discardFlag = true;
          // 一次只处理一只
          break;
        }
      }
      if (!discardFlag && myPets.length >= 2) {
        console.log('不丢宠而且数量够了，就去合成');
        await this.composePet();
      }
      this.discardPetInterval();
    },
    async composePet () {
      const myPets = this.user.myPets;
      const catchSkills = this.user.catchSkills;
      const screenSkill = this.checkScreenHasSkill();
      const composeSkill = screenSkill.filter(ss => catchSkills.includes(ss));
      console.log('本地图要抓的技能：', composeSkill);
      let pet1, pet2;
      for (let i = 0; i < myPets.length; i++) {
        const pet = myPets[i];
        const skills = pet.skill.map(skl => skl.name);
        // 判断拥有所有要的技能
        let flag = true;
        catchSkills.map(cs => {
          if (!skills.includes(cs)) {
            flag = false;
          }
        });
        if (flag) {
          console.log(`已经合成一只满足技能的宠【${skills.join(',')}】`)
          return;
        }
        // 判断拥有这个地图所有能抓的技能
        flag = true;
        composeSkill.map(cs => {
          if (!skills.includes(cs)) {
            flag = false;
          }
        });
        if (flag) {
          console.log(`这个地图所有能抓的都抓了【${skills.join(',')}】`)
          this.switchCombat(pet._id);
          return;
        }
        // 如果技能不齐，就跟下一个不齐的合成
        if (!pet1) {
          pet1 = pet._id;
        } else if (!pet2) {
          pet2 = pet._id;
        }
        if (pet1 && pet2) {
          console.log(`合成${pet1}和${pet2}`)
          this.game.fitPet(pet1, pet2);
          return;
        }
      }
    }
  }
}
</script>
<style lang="less" scoped>

</style>