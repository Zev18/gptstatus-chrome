let today = new Date();
console.log(
  today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
);
