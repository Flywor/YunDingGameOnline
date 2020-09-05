<template>
  <!-- 宠物信息↓ -->
  <div>
    <Tabs
      v-model="tabPaneName"
      size="small"
    >
      <TabPane
        v-for="(item, index) in petsInfo"
        :key="`${index}-${item._id}`"
        :label="`${item.name}(${item.skills.length})`"
        :name="`name${index+1}`"
      >
        <Divider size="small">状态：{{item.status?'已参战':'休息中'}}</Divider>
        <p
          style="padding:5px"
          v-if="item.skills.length === 0"
        >
          无技能
        </p>
        <Poptip
          v-else
          word-wrap
          transfer
          width="200"
          trigger="hover"
          v-for="(skill,index) in item.skills"
          :key="index"
          :content="skill.info"
        >
          <Button
            :style="skill.style"
            size="small"
          >{{skill.name}}</Button>
        </Poptip>

        <Table
          v-if="tabPaneName === `name${index+1}`"
          :show-header="false"
          :columns="columns"
          :data="item.data"
          border
        ></Table>
        <ButtonGroup
          size="small"
          shape="circle"
          class="pet-btn"
        >
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,3)"
          >放生</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,4)"
          >幻化</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,1)"
          >升级</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,2,1)"
          >全力</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,2,2)"
          >全魔</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,5)"
          >{{item.status?"休息":"参战"}}</Button>
          <Button
            size="small"
            type="primary"
            @click="handlePet(item,8)"
          >{{(item.bat_num && item.status)?"主":(item.status == 1 ? "副" : "")}}</Button>
        </ButtonGroup>
        <ButtonGroup
          size="small"
          shape="circle"
          class="pet-btn"
        >
          <Button
            size="small"
            type="success"
            @click="handlePet(item, 6)"
          >合宠</Button>
          <Button
            size="small"
            type="success"
            @click="handlePet(item, 7)"
          >打书</Button>
        </ButtonGroup>
      </TabPane>
    </Tabs>
    <!-- 防误操作modal -->
    <Modal
      v-model="modal"
      :styles="{top: '85px'}"
    >
      <p
        slot="header"
        style="color:#f60;text-align:center"
      >
        <Icon type="ios-information-circle"></Icon>
        <span>确定{{handleData.name}}？</span>
      </p>
      <div v-if="![5, 8].includes(handleData.type)" style="text-align:center">
        <img
          v-if="handleData.type<6"
          src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1593343846064&di=97a86fe902b9754de368f02e336e4eab&imgtype=0&src=http%3A%2F%2Fwww.11xzb.com%2Fd%2Ffile%2Fmoban5%2F201909020832%2F1567158444899421.png"
          alt=""
          style="width:120px;padding-top:5px"
        >
        <!-- 合宠 -->
        <div
          v-else-if="handleData.type===6"
          class="slelect-box"
        >
          <Select
            v-model="pet1"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet2] | disabled"
              :value="item.value"
              :key="item.value"
            >{{item.label}}({{item.skills.length}})</Option>
          </Select>
          <p>技能：{{selectPet1}}</p>
          <Select
            v-model="pet2"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet1] | disabled"
              :value="item.value"
              :key="item.value"
            >{{item.label}}({{item.skills.length}})</Option>
          </Select>
          <p>技能：{{selectPet2}}</p>
        </div>
        <!-- 打书 -->
        <div
          v-else
          class="slelect-box"
        >
          <Select
            v-model="pet1"
            size="small"
          >
            <Option
              v-for="item in petList"
              :disabled="[item.status,item.value,pet2] | disabled"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
          <p>技能：{{selectPet1}}</p>
          <Select
            v-model="pet2"
            size="small"
          >
            <Option
              v-for="item in bookList"
              :value="item.value"
              :key="item.value"
            >{{ item.label }}</Option>
          </Select>
        </div>
        <p v-if='handleData.type === 1'>点击确认继续升级，或者点击取消关闭面板</p>
        <p v-if='handleData.type === 3 && handleData.data.status===1'>宠物正在参战...</p>
      </div>
      <div
        slot="footer"
        style="text-align:center"
      >
        <Button
          size="small"
          @click="modal=false"
        >取消</Button>
        <Button
          type="primary"
          size="small"
          :disabled="handleData.type === 3 && handleData.data.status===1"
          @click="confirmHandle"
        >确认</Button>
      </div>
    </Modal>
  </div>
  <!-- 宠物信息↑ -->
</template>
<script>
export default {
  name: 'pet',
  props: {
    user: { type: Object, default: () => ({}) },
    game: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      tabPaneName: "name1",
      columns: [
        {
          title: "column1",
          key: "column1",
          align: "center",
        },
        {
          title: "column2",
          key: "column2",
          width: 120,
          align: "center",
        },
        {
          title: "column3",
          key: "column3",
          width: 80,
          align: "center",
        },
      ],
      modal: false,
      handleData: {},
      pet1: "",
      pet2: ""
    }
  },
  mounted () {
    this.game.getMyPet();
  },
  filters: {
    //参战宠物和重复不能选
    disabled(val) {
      return val[0] ? true : false || val[1] === val[2];
    }
  },
  computed: {
    petsInfo () {
      const arr = this.user.myPets;
      let pets = [];
      const type = this.rareType;
      arr &&
        arr.forEach((ele) => {
          const { skill, _id, name, status, bat_num } = ele;
          const data = [
            {
              column1: `等级：${ele.level}`,
              column2: `类型：${type[ele.type]}`,
              column3: `成长：${ele.growing_num.toFixed(2)}`,
            },
            {
              column1: `气血：${Math.round(ele.hp)}`,
              column2: `魔法：${Math.round(ele.mp)}`,
              column3: `命中：${Math.round(ele.hit)}`,
            },
            {
              column1: `攻击资质：${ele.str_zz}`,
              column2: `物理伤害：${Math.round(ele.physical_damage)}`,
              column3: `力量：${ele.str}`,
            },
            {
              column1: `法力资质：${ele.int_zz}`,
              column2: `魔法伤害：${Math.round(ele.magic_damage)}`,
              column3: `魔力：${ele.int}`,
            },
            // {
            //   column1: `体力资质：${ele.con_zz}`,
            //   column2: `魔法防御：${Math.round(ele.magic_defense)}`,
            //   column3: `体质：${ele.con}`,
            // },
            // {
            //   column1: `防御资质：${ele.vit_zz}`,
            //   column2: `物理防御：${Math.round(ele.physical_defense)}`,
            //   column3: `耐力：${ele.vit}`,
            // },

            // {
            //   column1: `速资质度：${ele.speed_zz}`,
            //   column2: `速度：${Math.round(ele.speed)}`,
            //   column3: `敏捷：${ele.agi}`,
            // },
            // {
            //   column1: `躲避质度：${ele.dodge_zz}`,
            //   column2: `躲避：${Math.round(ele.dodge)}`,
            //   column3: `潜力：${ele.potential_num}`,
            // },
          ];
          let skills = [];
          skill.forEach((item) => {
            skills.push({
              name: item.name,
              info: item.info,
              style: item.high ? "margin:5px;color:orchid" : "margin:5px;",
            });
          });
          const point = ele.potential_num;
          const obj = { _id, skills, name, data, status, point, bat_num };
          pets.push(obj);
        });
      return pets;
    },
    petList () {
      const options = [];
      this.petsInfo.forEach((ele) => {
        let skills = [];
        ele.skills.forEach((item) => {
          skills.push(item.name);
        });
        options.push({
          value: ele._id,
          label: `${ele.name} ， ${ele.data[0].column3}`,
          skills,
          status: ele.status,
        });
      });
      return options;
    },
    selectPet1 () {
      const pet = this.petList.find((ele) => this.pet1 === ele.value) || {
        skills: [],
      };
      return pet.skills.join("，") || "无";
    },
    selectPet2 () {
      const pet = this.petList.find((ele) => this.pet2 === ele.value) || {
        skills: [],
      };
      return pet.skills.join(",") || "无";
    },
    bookList () {
      const options = [];
      (this.user.goods || []).map((ele) => {
        ele.goodsType === "兽决" &&
          options.push({
            value: ele.id,
            label: ele.name,
          });
      });
      return options;
    }
  },
  methods: {
    //宠物相关操作
    handlePet(obj, type, point) {
      const arr = ["升级", "加点", "放生", "幻化", "参战/休息", "合成", "打书", "主副战宠切换"];
      const points = {
        str: point === 1 ? obj.point : 0, // 力量
        int: point === 2 ? obj.point : 0, // 智力
        agi: 0, // 敏捷
        vit: 0, // 耐力
        con: 0, // 体质
      };

      this.modal = true;
      this.handleData = {
        type: type,
        data: obj,
        point: type === 2 ? points : null,
        name: arr[type - 1],
      };
    },
    confirmHandle() {
      const data = this.handleData;

      //升级，放生，加点
      if (data.type < 4) {
        this.game.upUserPetLevel(data.data._id, data.type, data.point);
      }
      //幻化
      if (data.type === 4) {
        this.game.turnIntoPet(data.data._id);
        this.tabPaneName = "name1";
      }
      //参战 or 休息
      if (data.type === 5) {
        const status = data.data.status ? 0 : 1;
        this.game.playUserPet(data.data._id, status);
        this.tabPaneName = "name1";
      }
      //合宠
      if (data.type === 6) {
        this.game.fitPet(this.pet1, this.pet2);
        this.tabPaneName = `name${this.petsInfo.length - 1}`;
        this.pet1 = "";
        this.pet2 = "";
      }
      if (data.type === 7) {
        this.game.addUserPetSkill(this.pet2, this.pet1);
        this.pet1 = "";
        this.pet2 = "";
      }
      if (data.type === 8) {
        this.game.playUserPet(data.data._id, 3);
      }

      if (data.type !== 1) {
        this.modal = false;
      }
    }
  }
}
</script>
<style lang="less" scoped>
.pet-btn {
  padding-top: 5px;
  display: flex !important;
  justify-content: center;
  .ivu-btn {
    padding: 0 6px !important;
  }
}

.slelect-box {
  padding: 10px;
  p {
    padding: 10px;
  }
}
</style>