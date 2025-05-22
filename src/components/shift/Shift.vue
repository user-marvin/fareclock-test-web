<script setup lang="ts">
import Table from "../utility/Table.vue";
import Timezone from "../timezone/Timezone.vue";
import { ref } from "vue";
import { shift } from "../../server/request";
import Swal from "sweetalert2";

const currentTime = new Date();

const displayMonthYear = ref(
  currentTime.toLocaleString("default", { month: "long", year: "numeric" })
);

const handleSave = () => {
  const saveShift = async () => {
    try {
      const params = {};
      const response = await shift("PUT", params);
      if (response && response.status === 200) {
        Swal.fire({
          title: `Shift saved successfully: ${response.data}`,
          icon: "success",
          draggable: false,
        });
      }
    } catch (error) {
      console.error("Error saving shift:", error);
    }
  };
};
</script>

<template>
  <div>
    <div class="flex mx-auto justify-between items-center mb-4">
      <Timezone />
      <h1 class="text-2xl font-bold">{{ displayMonthYear }}</h1>
    </div>
    <Table v-model="displayMonthYear" />
  </div>
</template>
