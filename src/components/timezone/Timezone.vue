<script setup lang="ts">
import { onMounted, ref } from "vue";
import Dropdown from "../utility/Dropdown.vue";
import { timezone } from "../../server/request";
import Swal from "sweetalert2";
const timezones = [
  "Asia/Manila",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Asia/Dubai",
  "Europe/Moscow",
  "America/Sao_Paulo",
];

const defaultTimezone = ref("");
const errorMessage = ref("");

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const handleSave = () => {
  if (!defaultTimezone.value) {
    errorMessage.value = "Please select a timezone.";
    return;
  }
  errorMessage.value = "";

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
        emit("update:modelValue", true);
      }
    } catch (error) {
      errorMessage.value = "Error saving timezone.";
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
      }
    } catch (error) {
      console.error("Error fetching timezone:", error);
    }
  };

  getTimezone();
});
defineExpose({
  defaultTimezone,
  errorMessage,
});
</script>

<template>
  <div class="flex flex-col">
    <div class="w-52 flex gap-1 relative">
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
    <div>
      <p v-if="errorMessage" class="text-red-500 text-sm mt-2">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
