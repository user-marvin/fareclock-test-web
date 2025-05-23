<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  data: string[];
  placeholder?: string;
  modelValue?: string;
}>();

const search = ref("");
const selected = ref(props.modelValue || "");
const dropdownOpen = ref(false);

const filteredItem = computed(() =>
  props.data.filter((item: any) =>
    item.toLowerCase().includes(search.value.toLowerCase())
  )
);

function selectItem(timezone: string) {
  selected.value = timezone;
  search.value = timezone;
  dropdownOpen.value = false;
}

function onFocus() {
  dropdownOpen.value = true;
}

function onBlur(_: FocusEvent) {
  setTimeout(() => {
    dropdownOpen.value = false;
  }, 150);
}

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

watch(selected, (newValue) => {
  emit("update:modelValue", newValue);
});

watch(
  () => props.modelValue,
  (newVal) => {
    selected.value = newVal || "";
  }
);
</script>

<template>
  <div>
    <input
      type="text"
      v-model="search"
      :placeholder="selected ? selected : placeholder"
      autocomplete="off"
      @focus="onFocus"
      @blur="onBlur"
      class="w-50 rounded border border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <ul
      v-show="dropdownOpen && filteredItem.length > 0"
      class="hide-scrollbar absolute z-20 mt-1 max-h-48 w-50 overflow-auto rounded border border-gray-600 bg-gray-100 shadow-lg"
    >
      <li
        v-for="item in filteredItem"
        :key="item"
        @mousedown.prevent="selectItem(item)"
        class="cursor-pointer px-3 py-2 hover:bg-gray-300"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>
