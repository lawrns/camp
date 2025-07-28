/**
 * Animated Form Components - TEAM2-P4-005
 * Beautiful glass morphism forms with floating labels and validation animations
 *
 * This file is now a wrapper for the refactored components
 */

"use client";

export { AnimatedInput, AnimatedSelect, AnimatedTextArea, AnimatedFileUpload } from "./animated-form";

export type {
  FormFieldProps,
  SelectFieldProps,
  TextAreaFieldProps,
  FileUploadFieldProps,
  CheckboxFieldProps,
  RadioGroupProps,
  FormSectionProps,
  SubmitButtonProps,
  FormVariant,
} from "./animated-form";

// Legacy export for backward compatibility
export default {
  AnimatedInput: require("./animated-form").AnimatedInput,
  AnimatedSelect: require("./animated-form").AnimatedSelect,
  AnimatedTextArea: require("./animated-form").AnimatedTextArea,
  AnimatedFileUpload: require("./animated-form").AnimatedFileUpload,
};
