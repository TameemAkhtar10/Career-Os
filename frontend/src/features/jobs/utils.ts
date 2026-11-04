import { JobSalary } from "../../types/job";

export function formatSalary(salary?: JobSalary): string {
  if (!salary || salary.isVisible === false) {
    return "Not disclosed";
  }

  const { min, max } = salary;
  if (min == null && max == null) {
    return "Not disclosed";
  }

  const toLpa = (rupees: number) => {
    const lpa = rupees / 100000;
    return lpa % 1 === 0 ? lpa.toString() : lpa.toFixed(1);
  };

  if (min != null && max != null) {
    if (min === max) {
      return `₹${toLpa(min)} LPA`;
    }
    return `₹${toLpa(min)} – ${toLpa(max)} LPA`;
  }

  if (min != null) {
    return `From ₹${toLpa(min)} LPA`;
  }

  if (max != null) {
    return `Up to ₹${toLpa(max)} LPA`;
  }

  return "Not disclosed";
}

