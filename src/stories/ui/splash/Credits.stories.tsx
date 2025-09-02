import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  Credits,
  CreditsTitle,
  CreditsSubHeading,
  CreditsGrid,
  CreditsPerson,
} from "ui/splash/credits/Credits";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Credits> = {
  title: "UI/Splash/Credits",
  component: Credits,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: { onClose: fn() },
  decorators: [
    (Story) => (
      <div style={{ minWidth: 700, minHeight: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Credits>;

export const Default: Story = {
  render: (args) => (
    <Credits {...args}>
      <CreditsTitle>Title</CreditsTitle>
      <CreditsSubHeading>Contributors</CreditsSubHeading>
      <CreditsPerson>Person One</CreditsPerson>
      <CreditsPerson>Person Two</CreditsPerson>
      <CreditsPerson>Person Three</CreditsPerson>
      <CreditsGrid>
        <CreditsPerson>Person Four</CreditsPerson>
        <CreditsPerson>Person Five</CreditsPerson>
        <CreditsPerson>Person Six</CreditsPerson>
        <CreditsPerson>Person Seven</CreditsPerson>
        <CreditsPerson>Person Eight</CreditsPerson>
      </CreditsGrid>
    </Credits>
  ),
};
