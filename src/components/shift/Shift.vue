<script setup lang="ts">
import Table from "../utility/Table.vue";
import Timezone from "../timezone/Timezone.vue";
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import type { ShiftRecord } from "../../types/types";
import { shift } from "../../server/request";

const currentTime = new Date();

const displayMonthYear = ref(
  currentTime.toLocaleString("default", { month: "long", year: "numeric" })
);

const shiftRecord = ref<ShiftRecord[]>([]);

const handleSave = (params: { start: string; end: string }, id?: string) => {
  const saveShift = async () => {
    try {
      Swal.fire({
        title: id ? "Updating shift..." : "Saving shift...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let response: any = {};
      if (id) {
        response = await shift("PUT", params, id);
      } else {
        response = await shift("POST", params);
      }

      Swal.close();

      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: `Shift ${id ? "updated" : "saved"} successfully`,
          icon: "success",
          draggable: false,
        });
        getShift();
      }
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        title: `Error: ${error.response?.data?.message ?? "Unexpected error"}`,
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
  } catch (error: any) {
    Swal.fire({
      title: `Error: ${error.response?.data?.message}`,
      icon: "error",
      draggable: false,
    });
  }
};

const deleteShift = async (id: string) => {
  try {
    Swal.fire({
      title: "Deleting shifts...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const response = await shift("DELETE", {}, id);
    Swal.close();
    if (response && response.status >= 200 && response.status < 300) {
      Swal.fire({
        title: `Shift deleted successfully`,
        icon: "success",
        draggable: false,
      });
      getShift();
    }
  } catch (error: any) {
    Swal.fire({
      title: `Error: ${error.response?.data?.message}`,
      icon: "error",
      draggable: false,
    });
  }
};

onMounted(() => {
  getShift();
});

defineExpose({
  displayMonthYear,
  shiftRecord,
  handleSave,
  deleteShift,
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
