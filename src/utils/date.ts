// utils/date.ts
export const formatDateMMDDYYYY = (input: string | Date) => {
    const date = new Date(input);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const formatDateToISO = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};