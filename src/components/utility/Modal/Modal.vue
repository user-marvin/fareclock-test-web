<script setup lang="ts">
import { ref } from "vue";
import type { ShiftRecord } from "../../../types/types";

const props = defineProps({
  selectedShift: {
    type: Object as () => ShiftRecord,
    required: false,
  },
  date: {
    type: String,
    required: true,
  },
  closeModal: {
    type: Function,
    required: true,
  },
  saveFunction: {
    type: Function,
    required: true,
  },
  deleteShift: {
    type: Function,
    required: true,
  },
});
const getFormattedTime = (
  isoString: string | undefined | null,
  defaultValue: string
): string => {
  if (isoString) {
    const timezoneOffSet = new Date(isoString);
    return timezoneOffSet.toTimeString().split(" ")[0];
  }
  return defaultValue;
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const formattedDate = new Date(`${year}-${month}-${day}`);
  return formattedDate.toISOString().split("T")[0];
};

const defaultFrom = ref(getFormattedTime(props.selectedShift?.start, "09:00"));
const defaultTo = ref(getFormattedTime(props.selectedShift?.end, "17:00"));
const defaultDate = ref(formatDate(props.selectedShift?.start || props.date));

const handleSave = () => {
  const fromDate = new Date(`${defaultDate.value}T${defaultFrom.value}`);
  const toDate = new Date(`${defaultDate.value}T${defaultTo.value}`);
  const params = {
    start: fromDate.toISOString(),
    end: toDate.toISOString(),
  };
  props.saveFunction(params, props.selectedShift?.id);
  props.closeModal();
};

const handleDelete = () => {
  if (props.selectedShift) {
    props.deleteShift(props.selectedShift.id);
  }
  props.closeModal();
};

const handleClose = () => {
  props.closeModal();
};
</script>

<template>
  <div class="sm:w-150 xl:w-3/5 border bg-white p-4 rounded shadow-lg relative">
    <button
      @click="handleClose"
      class="absolute top-1 cursor-pointer right-2 text-gray-500"
    >
      &times;
    </button>
    <h2 v-if="!selectedShift" class="text-lg font-semibold mb-2">
      New Attendance
    </h2>
    <h2 v-else class="text-lg font-semibold mb-2">
      {{ `Edit attendance ${defaultDate}` }}
    </h2>
    <div class="mt-5 xl:flex xl:flex-row xl:gap-2 xl:justify-center">
      <label for="date" class=""
        >Date:
        <input
          type="date"
          v-model="defaultDate"
          class="border rounded px-2 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
      </label>

      <label for="from" class="">
        From:
        <input
          class="border rounded px-2 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="from"
          type="time"
          v-model="defaultFrom"
        />
      </label>

      <label for="to" class="">
        To:
        <input
          id="to"
          class="border rounded px-2 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="time"
          v-model="defaultTo"
        />
      </label>

      <div v-if="selectedShift" class="w-fit sm:hidden xl:block">
        <button
          @click="handleDelete"
          class="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.05 5.45c-.34-.059-.68-.114-1.022-.165M16.125 18H7.875m9.25-13.5H7.75"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="mt-5 mx-auto gap-1 flex justify-center">
      <button
        @click="handleSave"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 w-20 rounded transition-colors duration-150"
      >
        Save
      </button>
      <button
        @click="handleClose"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 w-20 rounded transition-colors duration-150"
      >
        Close
      </button>
      <button
        v-if="selectedShift"
        @click="handleDelete"
        class="sm:block xl:hidden cursor-pointer bg-red-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L5.05 5.45c-.34-.059-.68-.114-1.022-.165M16.125 18H7.875m9.25-13.5H7.75"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
