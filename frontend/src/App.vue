<script lang="ts">
import InputScatter from './components/InputScatter.vue'

export default {
  components: {
    InputScatter,
  }
}
</script>

<template>
  <div class=" flex-container">
    <div class = "border rounded border-black flex-item top">
       <div class = "border rounded border-black left">
            <InputScatter/>
       </div>
       <div class = "border rounded border-black right">
          article lists
       </div>
    </div>
    <div class = "border rounded border-black flex-item bottom">
       output scatter plot comparison of 2 lastest prompt
    </div>

  </div>
  <!-- <div class="border rounded border-black font-bold"> Hello World </div> -->
</template>

<style scoped>
.flex-container{
  display:flex;
  /* width:100%; */
  height:100%;
  flex-direction: column;
  gap:10px;
  padding: 10px 10px;
  /* flex-wrap: nowrap; */
  /* justify-content: space-evenly; */
}
.flex-item{
  flex:1
}
.top{
  /* flex:2; */
  gap: 10px;
  padding: 10px 10px;
  display: flex;
  flex-direction: row;
}
.bottom{
  /* flex:1; */
  background-color:lightblue;
}
.left{
  flex:1;
  background-color: antiquewhite;
}
.right{
  flex:1;
  background-color:rosybrown
}
</style>
