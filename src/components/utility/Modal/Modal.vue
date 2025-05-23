<script setup>
import { ref } from "vue";
import Dropdown from "../Dropdown.vue";

const defaultFrom = ref("09:00");
const defaultTo = ref("17:00");
const activity = [
  "Work",
  "Holiday",
  "Sick Leave",
  "Vacation",
  "Training",
  "Other",
];
const props = defineProps({
  date: String,
  closeModal: Function,
  saveFunction: Function,
});

// const selected = ref("");
const errorMessage = ref("");

const formattedDate = (() => {
  const d = new Date(props.date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
})();

const handleSave = () => {
  // if (!selected.value) {
  //   errorMessage.value = "Please select an activity.";
  //   return;
  // }
  // console.log("Selected activity:", selected.value);
  const fromDate = new Date(`${formattedDate}T${defaultFrom.value}`);
  const toDate = new Date(`${formattedDate}T${defaultTo.value}`);
  const params = {
    start: fromDate.toISOString(),
    end: toDate.toISOString(),
  };
  props.saveFunction(params);
  errorMessage.value = "";
  props.closeModal();
};
</script>

<template>
  <div class="sm:w-200 xl:w-2/5 border bg-white p-4 rounded shadow-lg relative">
    <button
      @click="closeModal"
      class="absolute top-1 cursor-pointer right-2 text-gray-500"
    >
      &times;
    </button>
    <h2 class="text-lg font-semibold mb-2">New Entry</h2>
    <!-- <div class="mt-5 flex flex-col">
      <div class="flex flex-row">
        <label for="date" class="mt-2">Activity: </label>
        <Dropdown
          :data="activity"
          placeholder="Select Activity"
          v-model="selected"
        />
      </div>
      <div class="ml-15">
        <p v-if="errorMessage" class="text-red-500 text-sm mt-2">
          {{ errorMessage }}
        </p>
      </div>
    </div> -->
    <div class="mt-5">
      <label for="date" class=""
        >Date:
        <input
          type="date"
          id="date"
          v-model="formattedDate"
          class="border rounded px-2 py-2"
        />
      </label>

      <label for="from" class="">
        From:
        <input
          class="border w-32 rounded px-2 py-2"
          id="from"
          type="time"
          v-model="defaultFrom"
        />
      </label>

      <label for="to" class="">
        To:
        <input
          id="to"
          class="border rounded px-2 py-2"
          type="time"
          v-model="defaultTo"
        />
      </label>
    </div>
    <div class="mt-5 mx-auto gap-1 flex justify-center">
      <button
        @click="handleSave"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
      >
        Save
      </button>
      <button
        @click="closeModal"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
      >
        Close
      </button>
    </div>
  </div>
</template>
