<script setup lang="ts">
import { reactive, watch } from "vue";
import { DateTime } from "luxon";
import Modal from "./Modal/Modal.vue";
import type { ShiftRecord } from "../../types/types";
import { calendarData } from "../../constant/constant";
interface TableState {
  currentYear: number;
  currentMonth: number;
  calendarDays: { date: Date; current: boolean }[];
  showModal: boolean;
  selectedDate: Date;
  selectedShift: ShiftRecord | null;
}

defineProps({
  saveFunction: {
    type: Function,
    required: true,
  },
  shiftRecord: {
    type: Array as () => ShiftRecord[],
    required: false,
  },
  deleteShift: {
    type: Function,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    required: true,
  },
});

const state = reactive<TableState>({
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  calendarDays: [],
  showModal: false,
  selectedDate: new Date(),
  selectedShift: null,
});

const updateCalendarDays = () => {
  const year = state.currentYear;
  const month = state.currentMonth;

  const daysPrevMonth = new Date(year, month, 0).getDate();
  const daysPresentMonth = new Date(year, month + 1, 0).getDate();

  let firstDayOfMonth = new Date(year, month, 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;

  const totalCells = calendarData.weeks * calendarData.days.length;
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

  state.calendarDays = newCalendarDays;
};

updateCalendarDays();

watch(
  [() => state.currentYear, () => state.currentMonth],
  () => {
    updateCalendarDays();
  },
  { deep: true }
);

const createEntry = (date: Date, selectedShift: ShiftRecord | null = null) => {
  state.showModal = !state.showModal;
  state.selectedDate = date;
  state.selectedShift = selectedShift;
};

const nextMonth = () => {
  if (state.currentMonth === 11) {
    state.currentMonth = 0;
    state.currentYear++;
  } else {
    state.currentMonth++;
  }
};

const prevMonth = () => {
  if (state.currentMonth === 0) {
    state.currentMonth = 11;
    state.currentYear--;
  } else {
    state.currentMonth--;
  }
};
const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

watch(
  () => [state.currentYear, state.currentMonth],
  () => {
    const newMonthYear = new Date(
      state.currentYear,
      state.currentMonth
    ).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    emit("update:modelValue", newMonthYear);
  },
  { immediate: true }
);
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
      <h1 class="block sm:hidden text-2xl font-bold">{{ modelValue }}</h1>

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
    <!-- headers -->
    <div
      class="hidden md:block md:grid md:grid-cols-7 border md:width-250 border-gray-300 divide-x divide-gray-300"
    >
      <div
        v-for="day in calendarData.days"
        :key="day"
        class="text-center font-semibold py-2 bg-gray-50"
      >
        {{ day }}
      </div>
    </div>
    <!-- days -->
    <div
      class="md:grid md:grid-cols-7 border md:border-t-0 border-gray-300 divide-x divide-y divide-gray-300"
    >
      <div
        v-for="(day, index) in state.calendarDays"
        :key="index"
        class="h-40 p-2"
        :class="[
          isToday(day.date)
            ? 'bg-blue-100'
            : index % 7 === 5 || index % 7 === 6
            ? 'bg-red-100'
            : day.current
            ? 'bg-white'
            : 'bg-gray-100 text-gray-400',
          ,
        ]"
      >
        <div class="font-bold">{{ day.date.getDate() }}</div>
        <div class="lg:h-30 overflow-y-auto hide-scrollbar">
          <div
            @click="() => createEntry(day.date)"
            class="new-attendance border border-gray-400 text-sm cursor-pointer mt-2 text-center py-2 md:py-1 rounded hover:bg-blue-100"
          >
            New Attendance
          </div>
          <div
            v-for="record in (shiftRecord || []).filter((record) => {
              const startDate = DateTime.fromISO(record.start, {
                zone: timezone,
              }).startOf('day');

              const dayDate = DateTime.fromObject(
                {
                  year: day.date.getFullYear(),
                  month: day.date.getMonth() + 1,
                  day: day.date.getDate(),
                },
                { zone: timezone }
              ).startOf('day');

              return startDate.toISODate() === dayDate.toISODate();
            })"
            :key="record.id"
            @click="() => createEntry(day.date, record)"
            class="named-attendance border border-gray-400 text-sm cursor-pointer mt-2 text-center py-2 md:py-1 rounded hover:bg-blue-100"
          >
            Marvin Villamar - {{ `[${record.duration}hrs]` }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="state.showModal"
    class="fixed inset-0 flex items-center justify-center backdrop-blur-xs"
  >
    <Modal
      :selectedShift="state.selectedShift ?? undefined"
      :date="state.selectedDate"
      :closeModal="createEntry"
      :saveFunction="saveFunction"
      :deleteShift="deleteShift"
      :timezone="timezone"
    />
  </div>
</template>
