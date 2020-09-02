<template>
  <!-- 任务↓ -->
  <div>
    <List>
      <ListItem v-for="task in user.userTasks" :key="task.utid">
        <ListItemMeta
          :description="`${task.info} - 所需物品：${task.need.join(',')}`"
        >
          <template slot="title">
            <p v-html="`${task.title} - 奖励物品：${task.give.join(',')}`"></p>
          </template>
        </ListItemMeta>
        <template slot="action">
          <li>
            <a @click="game.payUserTask(task.utid)">完成</a>
          </li>
        </template>
      </ListItem>
    </List>
    <Divider orientation="left">系统任务</Divider>
    <List>
      <ListItem v-for="task in user.systemTask" :key="task._id">
        <ListItemMeta
          :description="`${task.info}`"
        >
          <template slot="title">
            <p v-html="task.title"></p>
          </template>
        </ListItemMeta>
        <template slot="action">
          <li>
            <a @click="game.getCopyTask(task._id)">领取</a>
          </li>
        </template>
      </ListItem>
    </List>
  </div>
  <!-- 任务↑ -->
</template>
<script>
export default {
  name: 'tasks',
  data () {
    return {
      user: window.user,
      game: window.game
    }
  }
}
</script>
<style lang="less" scoped>

</style>