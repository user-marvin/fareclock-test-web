import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../src/App.vue";

describe("App.vue", () => {
  it("renders Dashboard component", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });
    expect(wrapper.findComponent({ name: "Dashboard" }).exists()).toBe(true);
  });
});
