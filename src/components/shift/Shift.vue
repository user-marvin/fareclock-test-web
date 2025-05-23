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

const handleSave = (params: { start: string; end: string }, id?: number) => {
  const saveShift = async () => {
    try {
      console.log("id", id);
      let response: any = {};
      if (id) {
        response = await shift("PUT", params, id);
      } else {
        response = await shift("POST", params);
      }
      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: `Shift ${id ? "updated" : "saved"} successfully`,
          icon: "success",
          draggable: false,
        });
        getShift();
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

const deleteShift = async (id: number) => {
  try {
    const response = await shift("DELETE", {}, id);
    if (response && response.status >= 200 && response.status < 300) {
      Swal.fire({
        title: `Shift deleted successfully`,
        icon: "success",
        draggable: false,
      });
      getShift();
    }
  } catch (error) {
    Swal.fire({
      title: `Error: ${error}`,
      icon: "error",
      draggable: false,
    });
  }
};

onMounted(() => {
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
      :deleteShift="deleteShift"
    />
  </div>
</template>
