<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "./Modal/Modal.vue";

const props = defineProps({
  monthYear: {
    type: String,
    required: true,
  },
});

const weeks = 5;
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());

const calendarDays = ref<any>([]);

const showModal = ref(false);
const selectedDate = ref<string | null>(null);

const updateCalendarDays = () => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const daysPrevMonth = new Date(year, month, 0).getDate();
  const daysPresentMonth = new Date(year, month + 1, 0).getDate();

  let firstDayOfMonth = new Date(year, month, 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;

  const totalCells = weeks * days.length;
  const newCalendarDays = [];

  const startPrevMonthDay = daysPrevMonth - firstDayOfMonth + 2;
  for (let i = 0; i < firstDayOfMonth - 1; i++) {
    newCalendarDays.push({
      date: new Date(year, month - 1, startPrevMonthDay + i),
      current: false,
    });
  }

  for (let i = 1; i <= daysPresentMonth; i++) {
    newCalendarDays.push({
      date: new Date(year, month, i),
      current: true,
    });
  }

  let i = 1;
  while (newCalendarDays.length < totalCells) {
    newCalendarDays.push({
      date: new Date(year, month + 1, i++),
      current: false,
    });
  }

  calendarDays.value = newCalendarDays;
};

updateCalendarDays();

watch([currentYear, currentMonth], () => {
  updateCalendarDays();
});

const createEntry = (date: string) => {
  showModal.value = !showModal.value;
  selectedDate.value = date;
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    // If it's December, go to next year, January
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    // Otherwise, just increment the month
    currentMonth.value++;
  }
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    // If it's January, go to previous year, December
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    // Otherwise, just decrement the month
    currentMonth.value--;
  }
};

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

watch(
  [currentYear, currentMonth],
  () => {
    const newMonthYear = new Date(
      currentYear.value,
      currentMonth.value
    ).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    emit("update:modelValue", newMonthYear);
  },
  { immediate: true }
); // immediate: true to run it once on initial setup
</script>

<template>
  <div class="mx-auto">
    <!-- next prev button -->
    <div class="flex justify-between items-center mb-1">
      <button
        @click="prevMonth"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 inline"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        @click="nextMonth"
        class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 inline"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
    <!-- days -->
    <div
      class="grid grid-cols-7 border border-gray-300 divide-x divide-gray-300"
    >
      <div
        v-for="day in days"
        :key="day"
        class="text-center font-semibold py-2 bg-gray-50"
      >
        {{ day }}
      </div>
    </div>

    <div
      class="grid grid-cols-7 border border-t-0 border-gray-300 divide-x divide-y divide-gray-300"
    >
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="h-40 p-2"
        :class="[
          index % 7 === 5 || index % 7 === 6
            ? 'bg-red-100'
            : day.current
            ? 'bg-white'
            : 'bg-gray-100 text-gray-400',
          ,
        ]"
      >
        <div class="font-bold">{{ day.date.getDate() }}</div>
        <div
          @click="() => createEntry(day.date)"
          class="border border-gray-400 text-sm cursor-pointer mt-2 text-center py-1 rounded hover:bg-blue-100"
        >
          Marvin Villamar - [Duration]
        </div>
        <div
          @click="() => createEntry(day.date)"
          class="border border-gray-400 text-sm cursor-pointer mt-2 text-center py-1 rounded hover:bg-blue-100"
        >
          New Entry
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showModal"
    class="fixed inset-0 flex items-center justify-center backdrop-blur-xs"
  >
    <Modal :date="selectedDate" :closeModal="createEntry" />
  </div>
</template>
