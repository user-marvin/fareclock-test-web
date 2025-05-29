<script setup lang="ts">
import { onMounted, ref } from "vue";
import Dropdown from "../utility/Dropdown.vue";
import { timezone } from "../../server/request";
import Swal from "sweetalert2";
import { timezones } from "../../constant/constant";

const defaultTimezone = ref<string>("");
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:timezone", value: string): void;
}>();
const handleSave = () => {
  const saveTimezone = async () => {
    try {
      Swal.fire({
        title: "Updating shifts...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const response = await timezone("PUT", {
        timezone: defaultTimezone.value,
      });

      Swal.close();
      if (response && response.status === 200) {
        Swal.fire({
          title: `Timezone saved successfully: ${response.data}`,
          icon: "success",
          draggable: false,
        });
        emit("update:timezone", response.data);
        emit("update:modelValue", true);
      }
    } catch (error: any) {
      Swal.fire({
        title: `Error: ${error.response?.data?.message}`,
        icon: "error",
        draggable: false,
      });
    }
  };
  saveTimezone();
};
onMounted(() => {
  const getTimezone = async () => {
    try {
      const response = await timezone("GET");
      if (response && response.status === 200) {
        defaultTimezone.value = response.data;
        emit("update:timezone", defaultTimezone.value);
      }
    } catch (error: any) {
      Swal.fire({
        title: `Error: ${error.response?.data?.message}`,
        icon: "error",
        draggable: false,
      });
    }
  };

  getTimezone();
});
defineExpose({
  defaultTimezone,
});
</script>

<template>
  <div
    class="flex flex-col w-full justify-center items-center sm:w-auto sm:justify-normal sm:items-stretch"
  >
    <div class="sm:w-52 flex gap-1 relative">
      <Dropdown
        :data="timezones"
        placeholder="Select Timezone"
        v-model="defaultTimezone"
      />
      <div>
        <button
          @click="handleSave"
          class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
