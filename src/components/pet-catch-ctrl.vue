<template>
  <div>
    <div class="br" />
    捕捉指定
    <i-switch v-model="user.catchType" size="large" true-color="#2db7f5" false-color="#2d8cf0" :disabled="user.isCompose">
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
    <p>
      <label v-if="user.catchType && user.catchPetBySkill && user.catchPetBySkill.length > 0">
        捕捉目标：【{{user.catchPetBySkill.join('，')}}】，
      </label>
      历史捕捉成功率：【{{catchRate}}%】
    </p>
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
    },
    catchRate () {
      return ((user.catchSuccess || 0) / (user.catchFail || 1) * 100).toFixed(2)
    }
  },
  watch: {
    'user.catchSkills': {
      deep: true,
      handler (cs) {
        if (this.screenMonsterMap.length === 0) return;
        const catchSkillCopy = JSON.parse(JSON.stringify(cs || []));
        if (catchSkillCopy.length === 0) return;
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
            let flag = false;
            smm.skill.map(sk => {
              let index = catchSkillCopy.findIndex(csc => csc === sk.name);
              if (index > -1) {
                catchSkillCopy.splice(index, 1);
                flag = true;
              }
            });
            if (flag) {
              catchPetBySkill.push(smm);
            }
          });
        this.user.catchPetBySkill = catchPetBySkill.sort((a, b) => a.monsterLevel - b.monsterLevel).map(smm => smm.monsterName);
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
            monsterLevel: ml.level,
            skill: ml.skill
          });
        }
    });
    this.screenMonsterMap = screenMonsterMap;
    this.handleAutoChange(this.user.isCompose);
  },
  methods: {
    // 检查当前副本有没有要捉的宠物
    checkScreenHasPet (petList) {
      if (!this.user.combatName || petList.length === 0) return;
      const monsterList = this.screenMonsterMap.filter(smm => smm.screenName === this.user.combatName);
      return monsterList.some(ml => petList.includes(ml.monsterName));
    },
    // 检查当前副本指定宠物能抓到的技能
    checkScreenHasSkill () {
      const obj = {};
      const catchList = this.user.catchPetBySkill;
      this.screenMonsterMap
        .filter(smm => smm.screenName === this.user.combatName && catchList.includes(smm.monsterName))
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
        const catchSkills = this.user.catchSkills;
        const catchList = this.user.catchPetBySkill;
        const pet = this.user.myPets.find(pet => pet._id === petId);
        const skills = pet.skill.map(skl => skl.name);
        let nextSkill;
        catchSkills.map(cs => {
          // 强调顺序
          if (!skills.includes(cs) && !nextSkill) {
            nextSkill = cs;
          }
        });
        if (!nextSkill) {
          this.switchCombat();
          return;
        }
        const monsterScreen = this.screenMonsterMap.find(smm => smm.skill.some(skl => skl.name === nextSkill) && catchList.includes(smm.monsterName));
        screenId = monsterScreen.screenId;
        this.$Message.info(`下一个要抓的技能是【${nextSkill}】，去【${monsterScreen.screenName}】`);
        console.log(`下一个要抓的技能是【${nextSkill}】，去【${monsterScreen.screenName}】`);
      } else {
        screenId = this.checkPetInScreen(this.user.catchPetBySkill[0]);
        this.$Message.info(`回到捕获目标第一只宠物重新抓`);
        console.log(`回到捕获目标第一只宠物重新抓`);
      }
      this.user.team.combat = screenId;
      this.game.switchCombatScreen(screenId);
    },
    async handleAutoChange (flag) {
      if (!flag) return;
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
      }
      if (this.checkScreenHasPet(catchList) === false){
        this.$Message.warning('当前副本没有符合捕捉条件的宠物，正在切换');
        console.log('当前副本没有符合捕捉条件的宠物，正在切换');
        this.switchCombat();
        await sleep(1000);
      }
      this.game.showMyTeam(0);
      this.game.startCombat(this.user.team.combat);
      this.game.getMyPet();
      this.loopPetCheck();
      // setTimeout(() => {
      //   window.location.reload();
      // }, 30 * 60 * 1000 + (Math.random()*30*1000));
    },
    // 丢宠判断
    discardPet (pet, reason) {
      if (pet.type == 3 || (pet.skill || []).length >= 6) {
        // 不丢神兽  不丢5技能以上的
        return false;
      }
      this.$Message.info(`丢弃${pet.name}【${(pet.skill || []).map(sk => sk.name).join(',') || '空'}】，原因【${reason}】`);
      console.log(`丢弃${pet.name}【${(pet.skill || []).map(sk => sk.name).join(',') || '空'}】，原因【${reason}】`);
      this.game.upUserPetLevel(pet._id, 3);
      return true;
    },
    // 循环判断合宠
    async loopPetCheck () {
      await sleep(6000);
      if (!this.user.isCompose) return;
      const myPets = this.user.myPets;
      const catchSkills = this.user.catchSkills;
      for (let i = 0; i < myPets.length; i++) {
        const pet = myPets[i];
        // 放生没技能 或 没有要的技能
        if ((!pet.skill || pet.skill.length === 0) || !pet.skill.some(skl => catchSkills.includes(skl.name))) {
          this.discardPet(pet, '没有要的技能');
        }
      }
      this.composePet();
      this.loopPetCheck();
    },
    async composePet () {
      const myPets = this.user.myPets;
      const catchSkills = this.user.catchSkills;
      const screenSkill = this.checkScreenHasSkill();
      const composeSkill = screenSkill.filter(ss => catchSkills.includes(ss));
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
          if (i >= 9) {
            this.$Message.success(`已经合成好多只了，自动停止脚本`);
            console.log(`合成脚本完成`, Date.now(), this.user.email);
            this.$set(this.user, 'fighting', false);
            this.$set(this.user, 'isCompose', false);
            return
          }
          continue;
        } else if (pet.type == 3) {
          // 避免神兽被拿来合成
          continue;
        }
        // 判断拥有这个地图所有能抓的技能
        flag = true;
        composeSkill.map(cs => {
          if (!skills.includes(cs)) {
            flag = false;
          }
        });
        if (!pet1 && flag) {
          this.$Message.success(`这个地图所有能抓的都抓了【${skills.join(',')}】`)
          console.log(`这个地图所有能抓的都抓了【${skills.join(',')}】`)
          await sleep(~~(Math.random() * 10 * 1000) + 1000);
          this.switchCombat(pet._id);
          return;
        }
        // 如果技能不齐，就跟下一个不齐的合成
        if (!pet1) {
          pet1 = pet;
        } else if (!pet2) {
          const pt1Skills = pet1.skill.map(skl => skl.name);
          if (skills.some(skl => !pt1Skills.includes(skl) && catchSkills.includes(skl))) {
            pet2 = pet;
          } else if (i >= 9) {
            this.discardPet(pet, '技能重复');
          }
        }
        if (pet1 && pet2) {
          this.$Message.info(`合成${pet1.name}【${pet1.skill.map(skl => skl.name).join('，')}】和${pet2.name}【${pet2.skill.map(skl => skl.name).join('，')}】`)
          console.log(`合成${pet1.name}【${pet1.skill.map(skl => skl.name).join('，')}】和${pet2.name}【${pet2.skill.map(skl => skl.name).join('，')}】`)
          console.log(`本图合成目标【${composeSkill.join(',')}】`)
          await sleep(~~(Math.random() * 10 * 1000) + 1000);
          this.game.fitPet(pet1._id, pet2._id);
          return;
        }
      }
    }
  }
}
</script>
<style lang="less" scoped>

</style>