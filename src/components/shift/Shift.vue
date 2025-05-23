<script setup lang="ts">
import Table from "../utility/Table.vue";
import Timezone from "../timezone/Timezone.vue";
import { onMounted, ref } from "vue";
import { shift } from "../../server/request";
import Swal from "sweetalert2";
import type { ShiftRecord } from "../../types/types";

const currentTime = new Date();

const displayMonthYear = ref(
  currentTime.toLocaleString("default", { month: "long", year: "numeric" })
);

const shiftRecord = ref<ShiftRecord[]>([]);

const handleSave = (params: { start: string; end: string }) => {
  const saveShift = async () => {
    try {
      const response = await shift("POST", params);
      console.log("Response:", response);
      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: "Shift saved successfully",
          icon: "success",
          draggable: false,
        });
      }
    } catch (error) {
      Swal.fire({
        title: `Error: ${error}`,
        icon: "error",
        draggable: false,
      });
    }
  };
  saveShift();
};

onMounted(() => {
  const getShift = async () => {
    try {
      const response = await shift("GET");
      if (response && response.status >= 200 && response.status < 300) {
        shiftRecord.value = response.data;
      }
    } catch (error) {
      Swal.fire({
        title: `Error: ${error}`,
        icon: "error",
        draggable: false,
      });
    }
  };
  getShift();
});
</script>

<template>
  <div>
    <div class="flex mx-auto justify-between items-center mb-4">
      <Timezone />
      <h1 class="text-2xl font-bold">{{ displayMonthYear }}</h1>
    </div>
    <Table
      :saveFunction="handleSave"
      :shiftRecord="shiftRecord"
      v-model="displayMonthYear"
    />
  </div>
</template>
